const request = require("supertest")
const { sessionCookie } = require("../helpers/session")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

const prisma = require("../../prisma/client")

jest.mock("firebase-admin/auth", () => {
  const auth = {
    verifyIdToken: jest.fn(async () => ({
      uid: "fb-uid",
      email: "estudiante@ufps.edu.co",
      email_verified: true,
      name: "Estudiante",
    })),
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

describe("CU01/CU02 — registro e inicio de sesion", () => {
  test("POST /api/auth/firebase rechaza una peticion sin idToken (400)", async () => {
    const res = await request(app).post("/api/auth/firebase").send({})
    expect(res.status).toBe(400)
  })

  test("POST /api/auth/firebase con token verificado crea al estudiante y entrega la cookie de sesion", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(estudianteBase)
      .mockResolvedValueOnce(estudianteBase)
    prisma.user.create.mockResolvedValue(estudianteBase)
    prisma.user.update.mockResolvedValue(estudianteBase)
    const enrollmentService = require("../../src/services/enrollmentService")
    jest.spyOn(enrollmentService, "hasActiveEnrollment").mockResolvedValue(false)
    jest.spyOn(enrollmentService, "getActiveGroupId").mockResolvedValue(null)

    const res = await request(app).post("/api/auth/firebase").send({ idToken: "token-valido" })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe("estudiante@ufps.edu.co")
    expect(res.body.user.role).toBe("student")
    expect(res.headers["set-cookie"].join(";")).toContain("token=")
    expect(prisma.user.create).toHaveBeenCalledTimes(1)
  })

  test("POST /api/auth/firebase con correo sin verificar se rechaza con 403", async () => {
    require("firebase-admin/auth").getAuth().verifyIdToken.mockResolvedValueOnce({
      uid: "fb-uid",
      email: "sinverificar@ufps.edu.co",
      email_verified: false,
    })
    prisma.user.findUnique.mockResolvedValue(null)

    const res = await request(app).post("/api/auth/firebase").send({ idToken: "token-sin-verificar" })
    expect(res.status).toBe(403)
  })

  test("el usuario ya registrado no se duplica: no hay user.create", async () => {
    prisma.user.findUnique.mockResolvedValue(estudianteBase)
    prisma.user.update.mockResolvedValue(estudianteBase)
    const enrollmentService = require("../../src/services/enrollmentService")
    jest.spyOn(enrollmentService, "hasActiveEnrollment").mockResolvedValue(false)
    jest.spyOn(enrollmentService, "getActiveGroupId").mockResolvedValue(null)

    const res = await request(app).post("/api/auth/firebase").send({ idToken: "token-valido" })

    expect(res.status).toBe(200)
    expect((res.headers["set-cookie"] || []).join(";")).toContain("token=")
    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "auth_login" }),
    )
  })

  test("una cuenta inactiva no puede iniciar sesion (403)", async () => {
    prisma.user.findUnique.mockResolvedValue({ ...estudianteBase, active: false })

    const res = await request(app).post("/api/auth/firebase").send({ idToken: "token-valido" })

    expect(res.status).toBe(403)
    expect((res.headers["set-cookie"] || []).join(";")).not.toContain("token=")
  })
})

describe("CU01/RF-02 — correo de verificacion", () => {
  test("POST /api/auth/request-verification envia el correo de verificacion", async () => {
    const res = await request(app)
      .post("/api/auth/request-verification")
      .send({ email: "estudiante@ufps.edu.co" })

    expect(res.status).toBe(200)
    expect(mockEmailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "estudiante@ufps.edu.co", category: "verification" }),
    )
  })

  test("POST /api/auth/request-verification responde generico para un correo inexistente", async () => {
    require("firebase-admin/auth").getAuth().generateEmailVerificationLink.mockRejectedValueOnce(
      Object.assign(new Error("no existe"), { code: "auth/user-not-found" }),
    )
    const res = await request(app)
      .post("/api/auth/request-verification")
      .send({ email: "nadie@ufps.edu.co" })

    expect(res.status).toBe(200)
    expect(res.body.message).toContain("Si el correo existe")
  })

  test("POST /api/auth/request-verification rechaza un cuerpo con correo invalido (400)", async () => {
    const res = await request(app)
      .post("/api/auth/request-verification")
      .send({ email: "no-es-un-correo" })
    expect(res.status).toBe(400)
  })
})

describe("CU03/RF-03 — restablecimiento de contrasena", () => {
  test("POST /api/auth/request-password-reset rechaza un correo invalido (400)", async () => {
    const res = await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: "no-es-un-correo" })
    expect(res.status).toBe(400)
  })

  test("POST /api/auth/request-password-reset responde generico aunque el correo no exista", async () => {
    require("firebase-admin/auth").getAuth().generatePasswordResetLink.mockRejectedValueOnce(
      Object.assign(new Error("user no existe"), { code: "auth/user-not-found" }),
    )
    const res = await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: "nadie@ufps.edu.co" })
    expect(res.status).toBe(200)
    expect(res.body.message).toContain("Si el correo existe")
  })

  test("un fallo de Firebase al generar el enlace se reporta como 500", async () => {
    require("firebase-admin/auth").getAuth().generatePasswordResetLink
      .mockRejectedValueOnce(new Error("firebase caido"))

    const res = await request(app)
      .post("/api/auth/request-password-reset")
      .send({ email: "estudiante@ufps.edu.co" })
    expect(res.status).toBe(500)
  })
})

describe("CU02 — ciclo de sesion", () => {
  test("GET /api/auth/me sin sesion responde 401", async () => {
    const res = await request(app).get("/api/auth/me")
    expect(res.status).toBe(401)
  })

  test("GET /api/auth/me con sesion valida devuelve el usuario de la sesion", async () => {
    prisma.user.findUnique.mockResolvedValue(estudianteBase)
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", sessionCookie({ id: "user-1", role: "student", hasEnrollment: false }))
    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe("user-1")
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } }),
    )
  })

  test("GET /api/auth/me con sesion invalida responde 401", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", "token=firma-falsa")
    expect(res.status).toBe(401)
  })

  test("GET /api/auth/me con cuenta desactivada responde 403 y limpia la cookie", async () => {
    prisma.user.findUnique.mockResolvedValue({ ...estudianteBase, active: false })

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", sessionCookie({ id: "user-1", role: "student", hasEnrollment: false }))

    expect(res.status).toBe(403)
    expect((res.headers["set-cookie"] || []).join(";")).toContain("token=;")
  })
})
