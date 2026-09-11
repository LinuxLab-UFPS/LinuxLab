process.env.LOG_LEVEL = "silent"

const http = require("http")
const { EventEmitter } = require("events")
const WebSocket = require("ws")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

const mockContainerService = {
  openPtySession: jest.fn(),
  resetTerminal: jest.fn(),
}
jest.mock("../../src/services/containerService", () => mockContainerService)

const mockEnrollmentService = {
  hasActiveEnrollment: jest.fn(async () => true),
  getActiveGroupId: jest.fn(async () => null),
}
jest.mock("../../src/services/enrollmentService", () => mockEnrollmentService)

const mockEmailService = {
  sendMail: jest.fn(async () => ({})),
}
jest.mock("../../src/services/emailService", () => mockEmailService)

jest.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: jest.fn() }) }))
jest.mock("../../src/config/firebase-admin", () => ({}))
jest.mock("../../src/config/firebase-storage", () => ({}))

const prisma = require("../../prisma/client")
const setupGateway = require("../../src/gateway")
const { sessionCookie } = require("../helpers/session")

const usuarioProvisionado = {
  id: "user-1",
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
  mockContainerService.openPtySession.mockImplementation(() => fakePty())
})

afterEach(() => {
  for (const client of clientes) {
    if (client.readyState === WebSocket.OPEN) client.terminate()
  }
})

function conectar(cookie) {
  const client = new WebSocket(`ws://127.0.0.1:${port}/terminal`, {
    headers: cookie ? { Cookie: cookie } : {},
  })
  client.on("error", () => {})
  clientes.push(client)
  return client
}

const esperarApertura = (client) =>
  new Promise((resolve) => client.once("open", resolve))

const esperarCierre = (client) =>
  new Promise((resolve) => client.once("close", (code, reason) => resolve({ code, reason: reason.toString() })))

const siguienteMensaje = (client) =>
  new Promise((resolve) => client.once("message", (data) => resolve(JSON.parse(data.toString()))))

const flush = () => new Promise((resolve) => setTimeout(resolve, 40))

const cookie = () => sessionCookie({ id: "user-1", role: "student", hasEnrollment: true })

describe("CU14 — sesion de terminal por WebSocket", () => {
  test("cierra con 4001 cuando no hay cookie de sesion", async () => {
    prisma.user.findUnique.mockResolvedValue(usuarioProvisionado)

    const client = conectar()
    const { code } = await esperarCierre(client)

    expect(code).toBe(4001)
  })

  test("cierra con 4001 cuando el usuario no tiene cuenta Linux", async () => {
    prisma.user.findUnique.mockResolvedValue({ ...usuarioProvisionado, linuxAccount: null })

    const client = conectar(cookie())
    const { code } = await esperarCierre(client)

    expect(code).toBe(4001)
    expect(mockContainerService.openPtySession).not.toHaveBeenCalled()
  })

  test("cierra con 4001 cuando la cuenta Linux aun no esta provisionada", async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...usuarioProvisionado,
      linuxAccount: { linux_username: "estudiante01", linux_provisioned: false },
    })

    const client = conectar(cookie())
    const { code } = await esperarCierre(client)

    expect(code).toBe(4001)
    expect(mockContainerService.openPtySession).not.toHaveBeenCalled()
  })

  test("cierra con 4001 cuando el estudiante no tiene matricula activa", async () => {
    prisma.user.findUnique.mockResolvedValue(usuarioProvisionado)
    mockEnrollmentService.hasActiveEnrollment.mockResolvedValue(false)

    const client = conectar(cookie())
    const { code } = await esperarCierre(client)

    expect(code).toBe(4001)
    expect(mockContainerService.openPtySession).not.toHaveBeenCalled()
  })

  test("abre la PTY y reenvia la entrada y el redimensionado del cliente", async () => {
    prisma.user.findUnique.mockResolvedValue(usuarioProvisionado)

    const client = conectar(cookie())
    await esperarApertura(client)
    await flush()

    expect(mockContainerService.openPtySession).toHaveBeenCalledWith("estudiante01")
    const pty = mockContainerService.openPtySession.mock.results[0].value

    client.send(JSON.stringify({ type: "input", data: "ls\n" }))
    await flush()
    expect(pty.write).toHaveBeenCalledWith("ls\n")

    client.send(JSON.stringify({ type: "resize", rows: 24, cols: 80 }))
    await flush()
    expect(pty.setWindow).toHaveBeenCalledWith(24, 80, 0, 0)
  })

  test("reinicia la sesion: mata los procesos y recrea la PTY", async () => {
    prisma.user.findUnique.mockResolvedValue(usuarioProvisionado)

    const client = conectar(cookie())
    await esperarApertura(client)
    await flush()
    const primeraPty = mockContainerService.openPtySession.mock.results[0].value

    const mensaje = siguienteMensaje(client)
    client.send(JSON.stringify({ type: "reset" }))

    expect((await mensaje).type).toBe("reset-ok")
    expect(primeraPty.destroy).toHaveBeenCalled()
    expect(mockContainerService.resetTerminal).toHaveBeenCalledWith("user-1")
    expect(mockContainerService.openPtySession).toHaveBeenCalledTimes(2)
  })

  test("cierra con 1008 al superar el limite de mensajes por segundo", async () => {
    prisma.user.findUnique.mockResolvedValue(usuarioProvisionado)

    const client = conectar(cookie())
    await esperarApertura(client)
    await flush()

    const cierre = esperarCierre(client)
    for (let i = 0; i < 31; i += 1) {
      client.send(JSON.stringify({ type: "resize", rows: 24, cols: 80 }))
    }

    expect((await cierre).code).toBe(1008)
  })

  test("cierra con 1009 ante un mensaje mayor al limite", async () => {
    prisma.user.findUnique.mockResolvedValue(usuarioProvisionado)

    const client = conectar(cookie())
    await esperarApertura(client)
    await flush()

    const cierre = esperarCierre(client)
    client.send("x".repeat(70 * 1024))

    expect((await cierre).code).toBe(1009)
  })
})
