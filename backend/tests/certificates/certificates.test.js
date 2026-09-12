const request = require("supertest")
const { sessionCookie } = require("../helpers/session")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

const mockAuditService = {
  audit: jest.fn(async () => ({})),
  requestMeta: jest.fn(() => ({ ip: "127.0.0.1", userAgent: "jest", actorRole: null })),
}
jest.mock("../../src/services/auditService", () => mockAuditService)

jest.mock("../../src/services/sshService", () => ({
  execCommand: jest.fn(async () => ({ code: 0, stdout: "", stderr: "" })),
  createExecStream: jest.fn(),
}))

const mockCertificateService = {
  resolveByCode: jest.fn(async () => ({ code: "CERT-1", holderName: "Sofía Ramírez" })),
  pdfByCode: jest.fn(async () => ({ buffer: Buffer.from("%PDF-1.4"), filename: "certificado.pdf" })),
  listMine: jest.fn(async () => [{ code: "CERT-1" }]),
  listByGroup: jest.fn(async () => [{ code: "CERT-1" }]),
  actaPdf: jest.fn(async () => ({ buffer: Buffer.from("%PDF-1.4"), filename: "acta.pdf" })),
}
jest.mock("../../src/services/certificateService", () => mockCertificateService)

const mockFinalizationService = {
  finalizationSummary: jest.fn(async () => ({ students: [], eligible: 0, total: 0 })),
}
jest.mock("../../src/services/finalizationService", () => mockFinalizationService)

const mockGroupService = {
  finalizeGroup: jest.fn(async () => ({ status: "finished", certificates: 3 })),
}
jest.mock("../../src/services/groupService", () => mockGroupService)

jest.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: jest.fn() }) }))
jest.mock("../../src/config/firebase-admin", () => ({}))
jest.mock("../../src/config/firebase-storage", () => ({}))

const { AppError } = require("../../src/lib/errors")

const GROUP_ID = "11111111-1111-1111-1111-111111111111"
let app
beforeAll(() => {
  app = require("../../src/app")
})
beforeEach(() => {
  jest.clearAllMocks()
})

const teacherCookie = () => sessionCookie({ id: "user-1", role: "teacher" })
const studentCookie = () => sessionCookie({ id: "user-2", role: "student", hasEnrollment: true })

describe("CU24/RF-34 — verificación pública de certificados", () => {
  test("verifica un certificado por su código sin sesión (200)", async () => {
    const res = await request(app).get("/api/certificates/CERT-1")
    expect(res.status).toBe(200)
    expect(res.body.holderName).toBe("Sofía Ramírez")
    expect(mockCertificateService.resolveByCode).toHaveBeenCalledWith("CERT-1")
  })

  test("responde 404 si el código no existe", async () => {
    mockCertificateService.resolveByCode.mockRejectedValueOnce(
      new AppError("Certificado no encontrado", 404, "NOT_FOUND"),
    )
    const res = await request(app).get("/api/certificates/NO-EXISTE")
    expect(res.status).toBe(404)
  })

  test("descarga el PDF del certificado (200, application/pdf)", async () => {
    const res = await request(app).get("/api/certificates/CERT-1/pdf")
    expect(res.status).toBe(200)
    expect(res.headers["content-type"]).toContain("application/pdf")
    expect(mockCertificateService.pdfByCode).toHaveBeenCalledWith("CERT-1")
  })

  test("lista mis certificados con sesión (200)", async () => {
    const res = await request(app).get("/api/certificates/mine").set("Cookie", studentCookie())
    expect(res.status).toBe(200)
    expect(mockCertificateService.listMine).toHaveBeenCalledWith("user-2")
  })

  test("lista mis certificados sin sesión responde 401", async () => {
    const res = await request(app).get("/api/certificates/mine")
    expect(res.status).toBe(401)
  })
})

describe("CU23/RF-32, RF-33 — cierre del grupo y certificación", () => {
  test("vista previa de finalización (200)", async () => {
    const res = await request(app)
      .get(`/api/groups/${GROUP_ID}/finalize/preview`)
      .set("Cookie", teacherCookie())
    expect(res.status).toBe(200)
    expect(mockFinalizationService.finalizationSummary).toHaveBeenCalled()
  })

  test("finaliza el grupo y emite los certificados (200)", async () => {
    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/finalize`)
      .set("Cookie", teacherCookie())
    expect(res.status).toBe(200)
    expect(res.body.status).toBe("finished")
    expect(mockGroupService.finalizeGroup).toHaveBeenCalled()
  })

  test("un estudiante no puede finalizar el grupo (403)", async () => {
    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/finalize`)
      .set("Cookie", studentCookie())
    expect(res.status).toBe(403)
  })

  test("lista los certificados del grupo (200)", async () => {
    const res = await request(app)
      .get(`/api/groups/${GROUP_ID}/certificates`)
      .set("Cookie", teacherCookie())
    expect(res.status).toBe(200)
    expect(mockCertificateService.listByGroup).toHaveBeenCalled()
  })

  test("descarga el acta del grupo en PDF (200)", async () => {
    const res = await request(app)
      .get(`/api/groups/${GROUP_ID}/certificates/acta`)
      .set("Cookie", teacherCookie())
    expect(res.status).toBe(200)
    expect(res.headers["content-type"]).toContain("application/pdf")
  })
})
