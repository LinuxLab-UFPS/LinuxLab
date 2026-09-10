const request = require("supertest")
const { sessionCookie } = require("../helpers/session")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

const prisma = require("../../prisma/client")

jest.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ verifyIdToken: jest.fn() }),
}))

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

const cookieFor = (role, id) => sessionCookie({ id, role, hasEnrollment: false })

describe("RF-05 — control de acceso por rol (requireRoles)", () => {
  test("una sesion de estudiante no accede a rutas de administrador (403)", async () => {
    const res = await request(app)
      .get("/api/admin/docentes")
      .set("Cookie", cookieFor("student", "user-1"))
    expect(res.status).toBe(403)
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })

  test("una sesion de docente no accede a rutas de administrador (403)", async () => {
    const res = await request(app)
      .get("/api/admin/docentes")
      .set("Cookie", cookieFor("docente", "user-2"))
    expect(res.status).toBe(403)
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })
})
