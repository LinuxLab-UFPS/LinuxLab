const request = require("supertest")
const { sessionCookie } = require("../helpers/session")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

const prisma = require("../../prisma/client")

jest.mock("firebase-admin/auth", () => {
  const auth = {
    getUserByEmail: jest.fn(async () => ({ uid: "fb-uid" })),
    createUser: jest.fn(async () => ({ uid: "fb-nuevo" })),
    generatePasswordResetLink: jest.fn(async () => "https://x/?oobCode=abc"),
    generateEmailVerificationLink: jest.fn(async () => "https://x/?oobCode=def"),
  }
  return { getAuth: () => auth }
})

const mockEmailService = {
  sendMail: jest.fn(async () => ({})),
  renderVerificationEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
  renderResetPasswordEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
  renderSetupAccountEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
  renderTeacherInviteEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
  renderStudentEnrollmentEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
  renderStudentCertificateEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
  renderTeacherFinalizationEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
  renderCertificateEmail: jest.fn(() => ({ subject: "", html: "", text: "" })),
}
jest.mock("../../src/services/emailService", () => mockEmailService)

jest.mock("../../src/utils/linuxUsername", () => ({
  createLinuxAccountWithUniqueUsername: jest.fn(async () => ({})),
  createLinuxAccountsUnique: jest.fn(async () => ({ success: [], failed: [] })),
  findFreeUsername: jest.fn(async () => "docente01"),
}))

const mockAuditService = {
  audit: jest.fn(async () => ({})),
  requestMeta: jest.fn(() => ({ ip: "127.0.0.1", userAgent: "jest", actorRole: null })),
}
jest.mock("../../src/services/auditService", () => mockAuditService)

jest.mock("../../src/config/firebase-admin", () => ({}))
jest.mock("../../src/config/firebase-storage", () => ({}))

const estudianteBase = {
  id: "user-1",
  email: "estudiante@ufps.edu.co",
  role: "student",
  name: "Estudiante",
  active: true,
  google_id: "fb-uid",
  verifiedEmail: true,
  linuxAccount: { linux_username: "est", linux_provisioned: true },
  student: { code: "1150001" },
  teacher: null,
  settings: null,
}

let app
beforeAll(() => {
  app = require("../../src/app")
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe("CU04/RF-06|RF-07 — registro de docentes", () => {
  const docenteBase = {
    id: "user-2",
    name: "Docente Uno",
    email: "docente@ufps.edu.co",
    active: true,
    teacher: { code: "D12345" },
    linuxAccount: { linux_username: "docente01", linux_provisioned: false },
  }

  const payloadValido = {
    name: "Docente Uno",
    email: "docente@ufps.edu.co",
    code: "D12345",
  }

  test("el administrador registra un docente y envía la invitación por correo (201)", async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.user.create.mockResolvedValue(docenteBase)
    prisma.user.update.mockResolvedValue(docenteBase)
    prisma.job.create.mockResolvedValue({})

    const res = await request(app)
      .post("/api/admin/docentes")
      .set("Cookie", sessionCookie({ id: "user-0", role: "admin" }))
      .send(payloadValido)

    expect(res.status).toBe(201)
    expect(res.body.email).toBe("docente@ufps.edu.co")
    expect(prisma.user.create).toHaveBeenCalledTimes(1)
    // RF-07: el correo de activacion sale inmediatamente
    expect(mockEmailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "docente@ufps.edu.co", category: "teacher_invite" }),
    )
    // el aprovisionamiento de su cuenta Linux queda encolado (puente con la iteracion del entorno)
    expect(prisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "user_provisioning" }),
      }),
    )
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "teacher_registered" }),
    )
  })

  test("no se puede registrar un correo de administrador como docente (409)", async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...estudianteBase,
      id: "user-9",
      email: "admin@ufps.edu.co",
      role: "admin",
    })

    const res = await request(app)
      .post("/api/admin/docentes")
      .set("Cookie", sessionCookie({ id: "user-0", role: "admin" }))
      .send({ name: "X", email: "admin@ufps.edu.co", code: "D00001" })

    expect(res.status).toBe(409)
  })

  test("el registro de docente rechaza un payload incompleto (400)", async () => {
    const res = await request(app)
      .post("/api/admin/docentes")
      .set("Cookie", sessionCookie({ id: "user-0", role: "admin" }))
      .send({ name: "Docente" })
    expect(res.status).toBe(400)
  })
})
