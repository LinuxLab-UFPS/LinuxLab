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

jest.mock("../../src/utils/linuxUsername", () => ({
  createLinuxAccountWithUniqueUsername: jest.fn(async () => "est-nuevo"),
  createLinuxAccountsUnique: jest.fn(async () => ({ success: [], failed: [] })),
  findFreeUsername: jest.fn(async () => "est-nuevo"),
}))

const mockEmailService = {
  sendMail: jest.fn(async () => ({})),
  renderStudentEnrollmentEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
  renderVerificationEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
  renderResetPasswordEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
  renderCertificateEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
}
jest.mock("../../src/services/emailService", () => mockEmailService)

jest.mock("../../src/services/attemptService", () => ({
  topicActivitiesTotal: jest.fn(async () => 0),
  passedTopicCountByEnrollment: jest.fn(async () => new Map()),
}))

jest.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: jest.fn() }) }))
jest.mock("../../src/config/firebase-admin", () => ({}))
jest.mock("../../src/config/firebase-storage", () => ({}))

const GROUP_ID = "11111111-1111-1111-1111-111111111111"

let app
beforeAll(() => {
  app = require("../../src/app")
})
beforeEach(() => {
  jest.clearAllMocks()
  prisma.user.findUnique.mockImplementation(async ({ where }) => {
    if (where?.email) return byEmail[where.email] ?? null
    if (where?.id) return byId[where.id] ?? null
    return null
  })
})

let byEmail = {}
let byId = {}

const teacherCookie = () => sessionCookie({ id: "user-1", role: "teacher" })
const studentCookie = () => sessionCookie({ id: "user-2", role: "student", hasEnrollment: true })
const studentCookieEmail = (email) =>
  sessionCookie({ id: "user-2", role: "student", hasEnrollment: true, email })

const grupoActivo = {
  id: GROUP_ID,
  name: "Sistemas Operativos",
  status: "active",
  teacher_id: "user-1",
  group_dir: "G-0007",
  invite_token: "token-valido",
  teacher: { user: { name: "Ana Torres" } },
}

describe("CU10 — información pública del grupo por enlace", () => {
  test("devuelve la información con un token válido (200)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)

    const res = await request(app).get(`/api/enroll/group/${GROUP_ID}/info?token=token-valido`)

    expect(res.status).toBe(200)
    expect(res.body.name).toBe("Sistemas Operativos")
    expect(res.body.teacherName).toBe("Ana Torres")
  })

  test("rechaza un token inválido (403)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)

    const res = await request(app).get(`/api/enroll/group/${GROUP_ID}/info?token=otro`)

    expect(res.status).toBe(403)
  })

  test("responde 404 si el grupo no existe o no está activo", async () => {
    prisma.group.findUnique.mockResolvedValue({ ...grupoActivo, status: "archived" })

    const res = await request(app).get(`/api/enroll/group/${GROUP_ID}/info?token=token-valido`)

    expect(res.status).toBe(404)
  })
})

describe("CU10 — auto-inscripción con el enlace de invitación", () => {
  test("sin sesión responde 401", async () => {
    const res = await request(app)
      .post(`/api/enroll/group/${GROUP_ID}`)
      .send({ token: "token-valido" })
    expect(res.status).toBe(401)
  })

  test("con token inválido responde 403", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)

    const res = await request(app)
      .post(`/api/enroll/group/${GROUP_ID}`)
      .set("Cookie", studentCookie())
      .send({ token: "otro" })

    expect(res.status).toBe(403)
  })

  test("un estudiante se inscribe, encola su aprovisionamiento y refresca la cookie (200)", async () => {
    const studentUser = {
      id: "user-2",
      name: "Sofía Ramírez",
      email: "estudiante2@ufps.edu.co",
      role: "student",
      active: true,
      student: { user_id: "user-2", code: "1150002" },
      linuxAccount: { user_id: "user-2", linux_username: "est-2", linux_provisioned: false },
    }
    byEmail = { "estudiante2@ufps.edu.co": studentUser }
    byId = { "user-2": studentUser }

    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.linuxAccount.findUnique.mockResolvedValue({ linux_username: "docente01" })
    prisma.enrollment.findUnique.mockResolvedValue(null)
    prisma.enrollment.findFirst.mockResolvedValue(null)
    prisma.enrollment.create.mockResolvedValue({ id: "enr-1" })
    prisma.enrollment.count.mockResolvedValue(1)
    prisma.job.create.mockResolvedValue({})

    const res = await request(app)
      .post(`/api/enroll/group/${GROUP_ID}`)
      .set("Cookie", studentCookieEmail("estudiante2@ufps.edu.co"))
      .send({ token: "token-valido" })

    expect(res.status).toBe(200)
    expect(res.body.enrolled).toBe(true)
    expect(prisma.enrollment.create).toHaveBeenCalled()
    expect(prisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "user_provisioning" }),
      }),
    )
    expect((res.headers["set-cookie"] || []).join(";")).toContain("token=")
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "student_joined" }),
    )
  })
})

describe("CU10 — gestión de estudiantes de un grupo por el docente", () => {
  test("vincula un estudiante individual (201)", async () => {
    const nuevo = {
      id: "user-9",
      name: "Nuevo Estudiante",
      email: "nuevo@ufps.edu.co",
      role: "student",
      student: { user_id: "user-9", code: "1150009" },
      linuxAccount: { user_id: "user-9", linux_username: "est-nuevo", linux_provisioned: false },
    }
    byEmail = {}
    byId = { "user-9": nuevo }

    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.linuxAccount.findUnique.mockResolvedValue({ linux_username: "docente01" })
    prisma.user.create.mockResolvedValue(nuevo)
    prisma.enrollment.findUnique.mockResolvedValue(null)
    prisma.enrollment.findFirst.mockResolvedValue(null)
    prisma.enrollment.create.mockResolvedValue({ id: "enr-9" })
    prisma.job.create.mockResolvedValue({})

    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/students`)
      .set("Cookie", teacherCookie())
      .send({ name: "Nuevo Estudiante", email: "nuevo@ufps.edu.co", code: "1150009" })

    expect(res.status).toBe(201)
    expect(res.body.enrolled).toBe(true)
    expect(prisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "user_provisioning" }) }),
    )
    expect(mockEmailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "nuevo@ufps.edu.co", category: "student_enrollment" }),
    )
  })

  test("lista los estudiantes matriculados (200)", async () => {
    prisma.group.findUnique.mockResolvedValue(grupoActivo)
    prisma.enrollment.findMany.mockResolvedValue([
      {
        id: "enr-1",
        status: "active",
        student_id: "user-2",
        created_at: new Date(),
        student: {
          code: "1150002",
          user: {
            id: "user-2",
            name: "Sofía Ramírez",
            email: "estudiante2@ufps.edu.co",
            last_login: null,
            linuxAccount: { linux_username: "est-2", linux_provisioned: true },
          },
        },
      },
    ])
    prisma.groupActivity.count.mockResolvedValue(0)

    const res = await request(app)
      .get(`/api/groups/${GROUP_ID}/students`)
      .set("Cookie", teacherCookie())

    expect(res.status).toBe(200)
    expect(res.body[0].name).toBe("Sofía Ramírez")
    expect(res.body[0].linuxUsername).toBe("est-2")
  })

  test("la carga CSV vacía responde 400", async () => {
    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/students/csv`)
      .set("Cookie", teacherCookie())
      .set("Content-Type", "text/csv")
      .send("")

    expect(res.status).toBe(400)
  })
})
