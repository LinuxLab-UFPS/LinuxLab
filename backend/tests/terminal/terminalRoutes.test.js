const request = require("supertest")
const { sessionCookie } = require("../helpers/session")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

const prisma = require("../../prisma/client")

const mockSsh = {
  execCommand: jest.fn(async () => ({ code: 0, stdout: "", stderr: "" })),
  createExecStream: jest.fn(),
}
jest.mock("../../src/services/sshService", () => mockSsh)

const mockAuditService = {
  audit: jest.fn(async () => ({})),
  requestMeta: jest.fn(() => ({ ip: "127.0.0.1", userAgent: "jest", actorRole: null })),
}
jest.mock("../../src/services/auditService", () => mockAuditService)

jest.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: jest.fn() }) }))
jest.mock("../../src/config/firebase-admin", () => ({}))
jest.mock("../../src/config/firebase-storage", () => ({}))

let app
beforeAll(() => {
  app = require("../../src/app")
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe("CU14 — reinicio de la terminal por HTTP", () => {
  test("POST /api/terminal/reset sin sesion responde 401", async () => {
    const res = await request(app).post("/api/terminal/reset")
    expect(res.status).toBe(401)
    expect(mockSsh.execCommand).not.toHaveBeenCalled()
  })

  test("un estudiante sin matricula activa recibe 403 sin tocar el entorno", async () => {
    const res = await request(app)
      .post("/api/terminal/reset")
      .set("Cookie", sessionCookie({ id: "user-1", role: "student", hasEnrollment: false }))

    expect(res.status).toBe(403)
    expect(mockSsh.execCommand).not.toHaveBeenCalled()
  })

  test("responde 400 cuando el usuario no tiene cuenta Linux configurada", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", linuxAccount: null })

    const res = await request(app)
      .post("/api/terminal/reset")
      .set("Cookie", sessionCookie({ id: "user-1", role: "student", hasEnrollment: true }))

    expect(res.status).toBe(400)
    expect(mockSsh.execCommand).not.toHaveBeenCalled()
  })

  test("reinicia la terminal matando los procesos del usuario (200)", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      linuxAccount: { linux_username: "estudiante01" },
    })

    const res = await request(app)
      .post("/api/terminal/reset")
      .set("Cookie", sessionCookie({ id: "user-1", role: "student", hasEnrollment: true }))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(mockSsh.execCommand).toHaveBeenCalledWith(
      expect.stringContaining("pkill -u estudiante01"),
    )
  })
})
