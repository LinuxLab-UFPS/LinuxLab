const request = require("supertest")
const { sessionCookie } = require("../helpers/session")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

jest.mock("../../src/services/sshService", () => ({
  execCommand: jest.fn(async () => ({ code: 0, stdout: "", stderr: "" })),
  createExecStream: jest.fn(),
}))

const mockAuditQueryService = {
  listAuditEvents: jest.fn(async () => ({ items: [], total: 0 })),
  listGroupAuditEvents: jest.fn(async () => []),
}
jest.mock("../../src/services/auditQueryService", () => mockAuditQueryService)

jest.mock("../../src/services/auditService", () => ({
  audit: jest.fn(async () => ({})),
  requestMeta: jest.fn(() => ({ ip: "127.0.0.1", userAgent: "jest", actorRole: null })),
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
})

const adminCookie = () => sessionCookie({ id: "user-0", role: "admin" })
const teacherCookie = () => sessionCookie({ id: "user-1", role: "teacher" })
const studentCookie = () => sessionCookie({ id: "user-2", role: "student", hasEnrollment: true })

describe("CU25/CU26/RF-35, RF-36 — consulta de la bitácora", () => {
  test("sin sesión responde 401", async () => {
    const res = await request(app).get("/api/audit")
    expect(res.status).toBe(401)
  })

  test("un estudiante no puede consultar la bitácora (403)", async () => {
    const res = await request(app).get("/api/audit").set("Cookie", studentCookie())
    expect(res.status).toBe(403)
  })

  test("el docente consulta la bitácora con su alcance (200)", async () => {
    const res = await request(app).get("/api/audit").set("Cookie", teacherCookie())
    expect(res.status).toBe(200)
    expect(mockAuditQueryService.listAuditEvents).toHaveBeenCalledWith(
      expect.objectContaining({ role: "teacher", userId: "user-1" }),
    )
  })

  test("el administrador consulta la bitácora del sistema con filtros (200)", async () => {
    const res = await request(app)
      .get("/api/audit?eventType=auth_login&category=auth&search=sofia")
      .set("Cookie", adminCookie())
    expect(res.status).toBe(200)
    expect(mockAuditQueryService.listAuditEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "admin",
        filters: expect.objectContaining({ eventType: "auth_login", category: "auth", search: "sofia" }),
      }),
    )
  })

  test("consulta la bitácora reciente de un grupo (200)", async () => {
    const res = await request(app)
      .get(`/api/audit/groups/${GROUP_ID}/recent?limit=5`)
      .set("Cookie", teacherCookie())
    expect(res.status).toBe(200)
    expect(mockAuditQueryService.listGroupAuditEvents).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: GROUP_ID, role: "teacher", userId: "user-1", limit: 5 }),
    )
  })

  test("la bitácora de grupo sin sesión responde 401", async () => {
    const res = await request(app).get(`/api/audit/groups/${GROUP_ID}/recent`)
    expect(res.status).toBe(401)
  })
})
