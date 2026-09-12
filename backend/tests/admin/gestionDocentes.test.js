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

let app
beforeAll(() => {
  app = require("../../src/app")
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe("CU05/RF-09 — activar e inactivar docentes", () => {
  const docenteBase = {
    id: "user-2",
    name: "Docente Uno",
    email: "docente@ufps.edu.co",
    active: true,
    teacher: { code: "D12345" },
    linuxAccount: { linux_username: "docente01", linux_provisioned: false },
  }

  test("el administrador inactiva la cuenta de un docente", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-2",
      teacher: { user_id: "user-2" },
      active: true,
    })
    prisma.user.update.mockResolvedValue({
      ...docenteBase,
      active: false,
    })

    const res = await request(app)
      .patch("/api/admin/docentes/user-2")
      .set("Cookie", sessionCookie({ id: "user-0", role: "admin" }))

    expect(res.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-2" },
        data: { active: false },
      }),
    )
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "teacher_toggled", target: "docente@ufps.edu.co" }),
    )
  })

  test("desactivar un id que no es docente responde 404", async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .patch("/api/admin/docentes/user-404")
      .set("Cookie", sessionCookie({ id: "user-0", role: "admin" }))

    expect(res.status).toBe(404)
  })
})

describe("CU05/RF-08 — listado de docentes", () => {
  test("una sesion de administrador lista los docentes (200)", async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: "user-2",
        name: "Docente",
        email: "docente@ufps.edu.co",
        active: true,
        teacher: { code: "D001" },
        linuxAccount: null,
      },
    ])
    const res = await request(app)
      .get("/api/admin/docentes")
      .set("Cookie", sessionCookie({ id: "user-0", role: "admin" }))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ teacher: { isNot: null } }) }),
    )
  })
})
