process.env.LOG_LEVEL = "silent"

const http = require("http")
const { EventEmitter } = require("events")
const WebSocket = require("ws")
const request = require("supertest")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})
const prisma = require("../../prisma/client")

const mockContainerService = {
  openPtySession: jest.fn(),
  resetTerminal: jest.fn(),
}
jest.mock("../../src/services/containerService", () => mockContainerService)

const mockSsh = {
  execCommand: jest.fn(async () => ({ code: 0, stdout: "", stderr: "" })),
  createExecStream: jest.fn(),
}
jest.mock("../../src/services/sshService", () => mockSsh)

const mockEnrollmentService = {
  hasActiveEnrollment: jest.fn(async () => true),
  getActiveGroupId: jest.fn(async () => null),
}
jest.mock("../../src/services/enrollmentService", () => mockEnrollmentService)

const mockAuditService = {
  audit: jest.fn(async () => ({})),
  requestMeta: jest.fn(() => ({ ip: "127.0.0.1", userAgent: "jest", actorRole: null })),
}
jest.mock("../../src/services/auditService", () => mockAuditService)

const mockEmailService = { sendMail: jest.fn(async () => ({})) }
jest.mock("../../src/services/emailService", () => mockEmailService)

jest.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: jest.fn() }) }))
jest.mock("../../src/config/firebase-admin", () => ({}))
jest.mock("../../src/config/firebase-storage", () => ({}))

const setupGateway = require("../../src/gateway")
const { sessionCookie } = require("../helpers/session")

const usuarioProvisionado = {
  id: "user-1",
  email: "estudiante@ufps.edu.co",
  role: "student",
  linuxAccount: { linux_username: "estudiante01", linux_provisioned: true },
}

describe("CU06..CU10 — la sesion de terminal exige matricula activa", () => {
  let server
  let closeGateway
  let port
  let clientes

  beforeAll(async () => {
    server = http.createServer()
    closeGateway = setupGateway(server)
    await new Promise((resolve) => server.listen(0, resolve))
    port = server.address().port
  })

  afterAll(async () => {
    closeGateway()
    await new Promise((resolve) => server.close(resolve))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    clientes = []
    mockEnrollmentService.hasActiveEnrollment.mockResolvedValue(true)
    mockContainerService.resetTerminal.mockResolvedValue({ ok: true })
    const pty = new EventEmitter()
    pty.write = jest.fn()
    pty.setWindow = jest.fn()
    pty.destroy = jest.fn()
    mockContainerService.openPtySession.mockImplementation(() => pty)
  })

  afterEach(() => {
    for (const client of clientes) {
      if (client.readyState === WebSocket.OPEN) client.terminate()
    }
  })

  test("cierra con 4001 cuando el estudiante no tiene matricula activa", async () => {
    prisma.user.findUnique.mockResolvedValue(usuarioProvisionado)
    mockEnrollmentService.hasActiveEnrollment.mockResolvedValue(false)

    const client = new WebSocket(`ws://127.0.0.1:${port}/terminal`, {
      headers: {
        Cookie: sessionCookie({ id: "user-1", role: "student", hasEnrollment: true }),
      },
    })
    client.on("error", () => {})
    clientes.push(client)

    const { code } = await new Promise((resolve) =>
      client.once("close", (c, reason) => resolve({ code: c, reason: reason.toString() })),
    )

    expect(code).toBe(4001)
    expect(mockContainerService.openPtySession).not.toHaveBeenCalled()
  })
})

describe("CU06..CU10 — el reinicio de terminal exige matricula activa", () => {
  let app
  beforeAll(() => {
    app = require("../../src/app")
  })

  test("un estudiante sin matricula activa recibe 403 sin tocar el entorno", async () => {
    const res = await request(app)
      .post("/api/terminal/reset")
      .set("Cookie", sessionCookie({ id: "user-1", role: "student", hasEnrollment: false }))

    expect(res.status).toBe(403)
    expect(mockSsh.execCommand).not.toHaveBeenCalled()
  })
})
