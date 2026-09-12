const request = require("supertest")
const { sessionCookie } = require("../helpers/session")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})
const prisma = require("../../prisma/client")

const mockAuditService = {
  audit: jest.fn(async () => ({})),
  requestMeta: jest.fn(() => ({ ip: "127.0.0.1", userAgent: "jest", actorRole: null })),
}
jest.mock("../../src/services/auditService", () => mockAuditService)

jest.mock("../../src/services/attemptService", () => ({
  topicActivitiesTotal: jest.fn(async () => 0),
}))

const mockEnrollmentService = {
  enrollMany: jest.fn(async () => ({ registered: 0, skipped: [] })),
  hasActiveEnrollment: jest.fn(async () => true),
  getActiveGroupId: jest.fn(async () => null),
}
jest.mock("../../src/services/enrollmentService", () => mockEnrollmentService)

jest.mock("../../src/services/containerService", () => ({
  teardownGroup: jest.fn(async () => ({})),
  createStudent: jest.fn(),
  openPtySession: jest.fn(),
}))

jest.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: jest.fn() }) }))
jest.mock("../../src/config/firebase-admin", () => ({}))
jest.mock("../../src/config/firebase-storage", () => ({}))

const containerService = require("../../src/services/containerService")
let app
beforeAll(() => {
  app = require("../../src/app")
})
beforeEach(() => {
  jest.clearAllMocks()
  mockEnrollmentService.enrollMany.mockResolvedValue({ registered: 0, skipped: [] })
})

const teacherCookie = () => sessionCookie({ id: "user-1", role: "teacher" })
const studentCookie = () => sessionCookie({ id: "user-2", role: "student", hasEnrollment: true })

const grupoActivo = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Sistemas Operativos",
  description: "Grupo de prueba",
  status: "active",
  teacher_id: "user-1",
  group_dir: "G-0007",
  invite_token: "token-viejo",
  created_at: new Date(),
}

describe("CU06/RF-10 — crear grupo de laboratorio", () => {
  test("un estudiante no puede crear grupos (403)", async () => {
    const res = await request(app)
      .post("/api/groups")
      .set("Cookie", studentCookie())
      .send({ name: "Grupo pirata" })
    expect(res.status).toBe(403)
  })

  test("rechaza la creación sin nombre (400)", async () => {
    const res = await request(app)
      .post("/api/groups")
      .set("Cookie", teacherCookie())
      .send({ description: "sin nombre" })
    expect(res.status).toBe(400)
  })

  test("no crea el grupo si la cuenta Linux del docente no está provisionada (409)", async () => {
    prisma.teacher.findUnique.mockResolvedValue({ user_id: "user-1" })
    prisma.linuxAccount.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post("/api/groups")
      .set("Cookie", teacherCookie())
      .send({ name: "Grupo sin entorno" })

    expect(res.status).toBe(409)
    expect(prisma.group.create).not.toHaveBeenCalled()
  })

  test("crea el grupo y encola su aprovisionamiento (201)", async () => {
    prisma.teacher.findUnique.mockResolvedValue({ user_id: "user-1" })
    prisma.linuxAccount.findUnique.mockResolvedValue({
      user_id: "user-1",
      linux_username: "docente01",
      linux_provisioned: true,
    })
    prisma.group.create.mockResolvedValue({ ...grupoActivo, group_dir: null, group_number: 7 })
    prisma.group.update.mockResolvedValue(grupoActivo)
    prisma.group.findUnique.mockResolvedValue({
      ...grupoActivo,
      teacher: { user: { name: "Ana Torres" } },
      _count: { enrollments: 0, groupActivities: 0 },
    })
    prisma.job.create.mockResolvedValue({})

    const res = await request(app)
      .post("/api/groups")
      .set("Cookie", teacherCookie())
      .send({ name: "Sistemas Operativos", description: "Grupo de prueba" })

    expect(res.status).toBe(201)
    expect(res.body.group.name).toBe("Sistemas Operativos")
    expect(prisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "group_provisioning" }),
      }),
    )
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "group_created" }),
    )
  })
})

describe("CU06/CU07/RF-11 — listar y editar grupos", () => {
  test("lista los grupos del docente (200)", async () => {
    prisma.group.findMany.mockResolvedValue([
      { ...grupoActivo, _count: { enrollments: 4, groupActivities: 2 } },
    ])

    const res = await request(app).get("/api/groups").set("Cookie", teacherCookie())

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].studentCount).toBe(4)
  })

  test("edita el nombre y la descripción de un grupo activo (200)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.group.update.mockResolvedValue({ ...grupoActivo, name: "Nuevo nombre" })

    const res = await request(app)
      .patch(`/api/groups/${grupoActivo.id}`)
      .set("Cookie", teacherCookie())
      .send({ name: "Nuevo nombre", description: "" })

    expect(res.status).toBe(200)
    expect(prisma.group.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Nuevo nombre" }) }),
    )
  })

  test("no edita un grupo que no está activo (409)", async () => {
    prisma.group.findUnique.mockResolvedValue({ ...grupoActivo, status: "finished" })

    const res = await request(app)
      .patch(`/api/groups/${grupoActivo.id}`)
      .set("Cookie", teacherCookie())
      .send({ name: "Nuevo nombre" })

    expect(res.status).toBe(409)
    expect(prisma.group.update).not.toHaveBeenCalled()
  })

  test("responde 404 ante un id de grupo inválido", async () => {
    const res = await request(app)
      .patch("/api/groups/no-es-uuid")
      .set("Cookie", teacherCookie())
      .send({ name: "X" })
    expect(res.status).toBe(404)
  })
})

describe("CU08/RF-12 — archivar y eliminar grupos", () => {
  test("archiva un grupo activo y encola el desmontaje del entorno (200)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.enrollment.findMany.mockResolvedValue([])
    prisma.linuxAccount.findUnique.mockResolvedValue({ linux_username: "docente01" })
    prisma.group.update.mockResolvedValue({ ...grupoActivo, status: "archived" })
    prisma.enrollment.updateMany.mockResolvedValue({ count: 0 })
    prisma.job.deleteMany.mockResolvedValue({ count: 0 })
    prisma.job.create.mockResolvedValue({})

    const res = await request(app)
      .patch(`/api/groups/${grupoActivo.id}/archive`)
      .set("Cookie", teacherCookie())

    expect(res.status).toBe(200)
    expect(prisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "group_teardown" }),
      }),
    )
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "group_archived" }),
    )
  })

  test("no se puede eliminar un grupo que no está archivado (409)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)

    const res = await request(app)
      .delete(`/api/groups/${grupoActivo.id}`)
      .set("Cookie", teacherCookie())

    expect(res.status).toBe(409)
  })

  test("elimina un grupo archivado y desmonta su entorno (204)", async () => {
    prisma.group.findUnique.mockResolvedValue({ ...grupoActivo, status: "archived" })
    prisma.linuxAccount.findUnique.mockResolvedValue({ linux_username: "docente01" })
    prisma.enrollment.findMany.mockResolvedValue([])

    const res = await request(app)
      .delete(`/api/groups/${grupoActivo.id}`)
      .set("Cookie", teacherCookie())

    expect(res.status).toBe(204)
    expect(containerService.teardownGroup).toHaveBeenCalled()
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "group_deleted" }),
    )
  })
})

describe("CU09/RF-13 — enlace de invitación", () => {
  test("rota el enlace de invitación del grupo (200)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.group.update.mockResolvedValue({})

    const res = await request(app)
      .post(`/api/groups/${grupoActivo.id}/invite/rotate`)
      .set("Cookie", teacherCookie())

    expect(res.status).toBe(200)
    expect(res.body.inviteUrl).toContain("/inscripcion?token=")
    expect(prisma.group.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ invite_token: expect.any(String) }) }),
    )
  })
})
