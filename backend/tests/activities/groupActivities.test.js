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

jest.mock("../../src/services/sshService", () => ({
  execCommand: jest.fn(async () => ({ code: 0, stdout: "", stderr: "" })),
  createExecStream: jest.fn(),
}))

jest.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: jest.fn() }) }))
jest.mock("../../src/config/firebase-admin", () => ({}))
jest.mock("../../src/config/firebase-storage", () => ({}))

const GROUP_ID = "11111111-1111-1111-1111-111111111111"
const ACTIVITY_ID = "22222222-2222-2222-2222-222222222222"

let app
beforeAll(() => {
  app = require("../../src/app")
})
beforeEach(() => {
  jest.clearAllMocks()
})

const teacherCookie = () => sessionCookie({ id: "user-1", role: "teacher" })
const studentCookie = () => sessionCookie({ id: "user-2", role: "student", hasEnrollment: true })

const grupoActivo = {
  id: GROUP_ID,
  name: "Sistemas Operativos",
  status: "active",
  teacher_id: "user-1",
  group_dir: "G-0007",
}

function filaActividad(overrides = {}) {
  return {
    id: ACTIVITY_ID,
    group_id: GROUP_ID,
    activity_number: 3,
    title: "Permisos por escrito",
    instructions: "Crea el archivo y ajusta permisos",
    difficulty: "basic",
    activity_type: "workshop",
    evaluation_type: "automatic",
    max_score: 100,
    checks: [{ id: "chk-1", type: "archivo_existe", params: { ruta: "informe.txt" }, points: 50 }],
    attempt_limit: null,
    topic_number: 5,
    required: true,
    enabled: true,
    due_at: null,
    workdir: "T-0003",
    ...overrides,
  }
}

describe("CU15/RF-20, RF-21 — crear y configurar actividades", () => {
  test("un estudiante no puede crear actividades (403)", async () => {
    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/activities`)
      .set("Cookie", studentCookie())
      .send({ title: "Actividad pirata" })
    expect(res.status).toBe(403)
  })

  test("rechaza la creación sin título (400)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/activities`)
      .set("Cookie", teacherCookie())
      .send({ activityType: "workshop" })
    expect(res.status).toBe(400)
  })

  test("una actividad automática exige al menos una aserción (400)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/activities`)
      .set("Cookie", teacherCookie())
      .send({ title: "Sin aserciones", activityType: "workshop", evaluationType: "automatic", checks: [] })
    expect(res.status).toBe(400)
  })

  test("un taller no admite límite de intentos (400)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/activities`)
      .set("Cookie", teacherCookie())
      .send({
        title: "Taller con tope",
        activityType: "workshop",
        evaluationType: "automatic",
        attemptLimit: 3,
        checks: [{ type: "archivo_existe", params: { ruta: "informe.txt" }, points: 50 }],
      })
    expect(res.status).toBe(400)
  })

  test("crea una actividad automática con aserciones y encola su registro (201)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.groupActivity.create.mockResolvedValue(filaActividad())
    prisma.groupActivity.update.mockResolvedValue(filaActividad())

    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/activities`)
      .set("Cookie", teacherCookie())
      .send({
        title: "Permisos por escrito",
        activityType: "workshop",
        evaluationType: "automatic",
        checks: [{ type: "archivo_existe", params: { ruta: "informe.txt" }, points: 50 }],
      })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe("Permisos por escrito")
    expect(res.body.activityType).toBe("workshop")
    expect(res.body.checks).toHaveLength(1)
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "activity_created" }),
    )
  })

  test("crea una actividad manual sin aserciones (201)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.groupActivity.create.mockResolvedValue(
      filaActividad({ evaluation_type: "manual", checks: [] }),
    )
    prisma.groupActivity.update.mockResolvedValue(
      filaActividad({ evaluation_type: "manual", checks: [] }),
    )

    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/activities`)
      .set("Cookie", teacherCookie())
      .send({ title: "Informe de práctica", activityType: "workshop", evaluationType: "manual" })

    expect(res.status).toBe(201)
    expect(res.body.evaluationType).toBe("manual")
  })

  test("no edita una actividad que ya tiene intentos o entregas (409)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.groupActivity.findFirst.mockResolvedValue({
      ...filaActividad(),
      _count: { submissions: 2 },
    })

    const res = await request(app)
      .patch(`/api/groups/${GROUP_ID}/activities/${ACTIVITY_ID}`)
      .set("Cookie", teacherCookie())
      .send({ title: "Otro título" })

    expect(res.status).toBe(409)
  })
})

describe("CU16/RF-22, RF-23 — habilitar, deshabilitar y extender cierre", () => {
  test("publica una actividad deshabilitada (200)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.groupActivity.findFirst
      .mockResolvedValueOnce(filaActividad({ enabled: false }))
      .mockResolvedValueOnce({ _count: { submissions: 0 } })
    prisma.groupActivity.update.mockResolvedValue(filaActividad({ enabled: true }))

    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/activities/${ACTIVITY_ID}/publish`)
      .set("Cookie", teacherCookie())

    expect(res.status).toBe(200)
    expect(res.body.enabled).toBe(true)
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "activity_enabled" }),
    )
  })

  test("no deshabilita una actividad con entregas (409)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.groupActivity.findFirst
      .mockResolvedValueOnce(filaActividad({ enabled: true }))
      .mockResolvedValueOnce({ _count: { submissions: 1 } })

    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/activities/${ACTIVITY_ID}/disable`)
      .set("Cookie", teacherCookie())

    expect(res.status).toBe(409)
  })

  test("extiende la fecha de cierre a una fecha futura (200)", async () => {
    const futura = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    const actual = new Date(Date.now() + 2 * 24 * 3600 * 1000)
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.groupActivity.findFirst.mockResolvedValue(filaActividad({ due_at: actual }))
    prisma.groupActivity.update.mockResolvedValue(filaActividad({ due_at: futura }))

    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/activities/${ACTIVITY_ID}/extend-due`)
      .set("Cookie", teacherCookie())
      .send({ dueDate: futura.toISOString() })

    expect(res.status).toBe(200)
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "activity_due_extended" }),
    )
  })

  test("rechaza una fecha de cierre anterior a la actual (400)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.groupActivity.findFirst.mockResolvedValue(filaActividad({ due_at: null }))

    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/activities/${ACTIVITY_ID}/extend-due`)
      .set("Cookie", teacherCookie())
      .send({ dueDate: new Date(Date.now() - 3600 * 1000).toISOString() })

    expect(res.status).toBe(400)
  })
})

describe("CU15/RF-21 — catálogo de aserciones", () => {
  test("el docente consulta el catálogo de aserciones (200)", async () => {
    const res = await request(app).get("/api/activities/catalog").set("Cookie", teacherCookie())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0]).toHaveProperty("type")
  })
})
