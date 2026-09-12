const request = require("supertest")
const { sessionCookie } = require("../helpers/session")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})
const prisma = require("../../prisma/client")

jest.mock("../../src/services/sshService", () => ({
  execCommand: jest.fn(async () => ({ code: 0, stdout: "", stderr: "" })),
  createExecStream: jest.fn(),
}))

jest.mock("../../src/services/auditService", () => ({
  audit: jest.fn(async () => ({})),
  requestMeta: jest.fn(() => ({ ip: "127.0.0.1", userAgent: "jest", actorRole: null })),
}))

const mockReconcileService = {
  reconcileAll: jest.fn(async () => ({ teachers: 0, groups: 0, students: 0, admins: 0 })),
  reconcileGroup: jest.fn(async () => ({ students: 0, groups: 0 })),
}
jest.mock("../../src/services/reconcileService", () => mockReconcileService)

const mockEnvironmentService = {
  snapshot: jest.fn(async () => ({ users: [], groups: [] })),
  requeueFailed: jest.fn(async () => ({ requeued: 2 })),
  ensureOwnAccount: jest.fn(async () => ({ ok: true })),
}
jest.mock("../../src/services/environmentService", () => mockEnvironmentService)

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

describe("CU27/RF-37 — reintento y reconciliación del aprovisionamiento", () => {
  test("el administrador reencola la reconciliación global (200)", async () => {
    const res = await request(app)
      .post("/api/admin/linux-accounts/reconcile")
      .set("Cookie", adminCookie())
    expect(res.status).toBe(200)
    expect(mockReconcileService.reconcileAll).toHaveBeenCalled()
  })

  test("un docente no accede a la reconciliación global (403)", async () => {
    const res = await request(app)
      .post("/api/admin/linux-accounts/reconcile")
      .set("Cookie", teacherCookie())
    expect(res.status).toBe(403)
  })

  test("el administrador consulta el estado del entorno (200)", async () => {
    const res = await request(app).get("/api/admin/environment").set("Cookie", adminCookie())
    expect(res.status).toBe(200)
    expect(mockEnvironmentService.snapshot).toHaveBeenCalled()
  })

  test("sin sesión el estado del entorno responde 401", async () => {
    const res = await request(app).get("/api/admin/environment")
    expect(res.status).toBe(401)
  })

  test("el administrador reintenta los aprovisionamientos fallidos (200)", async () => {
    const res = await request(app)
      .post("/api/admin/environment/requeue")
      .set("Cookie", adminCookie())
    expect(res.status).toBe(200)
    expect(mockEnvironmentService.requeueFailed).toHaveBeenCalled()
  })

  test("el administrador asegura su propia cuenta del entorno (200)", async () => {
    const res = await request(app)
      .post("/api/admin/environment/account")
      .set("Cookie", adminCookie())
    expect(res.status).toBe(200)
    expect(mockEnvironmentService.ensureOwnAccount).toHaveBeenCalledWith("user-0")
  })

  test("el docente reconcilia su grupo (200)", async () => {
    prisma.group.findUnique.mockResolvedValue({ id: GROUP_ID, teacher_id: "user-1", status: "active" })

    const res = await request(app)
      .post(`/api/groups/${GROUP_ID}/reconcile`)
      .set("Cookie", teacherCookie())

    expect(res.status).toBe(200)
    expect(mockReconcileService.reconcileGroup).toHaveBeenCalledWith({ groupId: GROUP_ID })
  })
})
