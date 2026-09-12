process.env.LOG_LEVEL = "silent"

const http = require("http")
const { EventEmitter } = require("events")
const WebSocket = require("ws")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})
const prisma = require("../../prisma/client")

const mockContainerService = {
  openPtySession: jest.fn(),
  resetTerminal: jest.fn(async () => ({ ok: true })),
}
jest.mock("../../src/services/containerService", () => mockContainerService)

const mockEnrollmentService = {
  hasActiveEnrollment: jest.fn(async () => true),
  getActiveGroupId: jest.fn(async () => null),
}
jest.mock("../../src/services/enrollmentService", () => mockEnrollmentService)

jest.mock("../../src/services/emailService", () => ({ sendMail: jest.fn(async () => ({})) }))
jest.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: jest.fn() }) }))
jest.mock("../../src/config/firebase-admin", () => ({}))
jest.mock("../../src/config/firebase-storage", () => ({}))

const setupGateway = require("../../src/gateway")
const { sessionCookie } = require("../helpers/session")

const usuarioProvisionado = {
  id: "user-2",
  email: "estudiante@ufps.edu.co",
  role: "student",
  linuxAccount: { linux_username: "estudiante01", linux_provisioned: true },
}

function fakePty() {
  const pty = new EventEmitter()
  pty.write = jest.fn()
  pty.setWindow = jest.fn()
  pty.destroy = jest.fn()
  return pty
}

/** RNF-05: capacidad de sesiones simultaneas (meta: 40). */
const N_SESIONES = 40

describe("RNF-05 — capacidad de sesiones simultaneas de terminal", () => {
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
    prisma.user.findUnique.mockResolvedValue(usuarioProvisionado)
    mockEnrollmentService.hasActiveEnrollment.mockResolvedValue(true)
    mockContainerService.openPtySession.mockImplementation(() => fakePty())
  })

  afterEach(() => {
    for (const client of clientes) {
      if (client.readyState === WebSocket.OPEN) client.terminate()
    }
  })

  test(`abre ${N_SESIONES} sesiones de terminal concurrentes sin serializarlas`, async () => {
    const cookie = sessionCookie({ id: "user-2", role: "student", hasEnrollment: true })

    const conexiones = Array.from({ length: N_SESIONES }, () => {
      const client = new WebSocket(`ws://127.0.0.1:${port}/terminal`, {
        headers: { Cookie: cookie },
      })
      client.on("error", () => {})
      clientes.push(client)
      return new Promise((resolve, reject) => {
        client.once("open", () => resolve(client))
        client.once("close", (code) => reject(new Error(`cerro con ${code}`)))
      })
    })

    const abiertas = await Promise.all(conexiones)

    expect(abiertas).toHaveLength(N_SESIONES)
    expect(mockContainerService.openPtySession).toHaveBeenCalledTimes(N_SESIONES)
    expect(abiertas.every((c) => c.readyState === WebSocket.OPEN)).toBe(true)
  })

  test("una sesion sin matricula no ocupa cupo (cierre 4001)", async () => {
    mockEnrollmentService.hasActiveEnrollment.mockResolvedValue(false)

    const client = new WebSocket(`ws://127.0.0.1:${port}/terminal`, {
      headers: {
        Cookie: sessionCookie({ id: "user-3", role: "student", hasEnrollment: true }),
      },
    })
    client.on("error", () => {})
    clientes.push(client)

    const { code } = await new Promise((resolve) =>
      client.once("close", (c) => resolve({ code: c })),
    )

    expect(code).toBe(4001)
    expect(mockContainerService.openPtySession).not.toHaveBeenCalled()
  })
})
