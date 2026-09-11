const request = require("supertest")
const { sessionCookie } = require("../helpers/session")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

const prisma = require("../../prisma/client")

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

const cookieUsuario = () => sessionCookie({ id: "user-1", role: "student", hasEnrollment: true })

const prefsBase = {
  terminal_font_size: 16,
  terminal_font_family: "monospace",
  theme: "dark",
}

describe("Settings (iteracion 2) — preferencias del entorno", () => {
  test("PUT /api/preferences sin sesion responde 401", async () => {
    const res = await request(app).put("/api/preferences").send({ theme: "dark" })
    expect(res.status).toBe(401)
  })

  test("rechaza un tamano de letra por debajo del minimo (400)", async () => {
    const res = await request(app)
      .put("/api/preferences")
      .set("Cookie", cookieUsuario())
      .send({ terminalFontSize: 11 })
    expect(res.status).toBe(400)
    expect(prisma.settings.upsert).not.toHaveBeenCalled()
  })

  test("rechaza un tamano de letra por encima del maximo (400)", async () => {
    const res = await request(app)
      .put("/api/preferences")
      .set("Cookie", cookieUsuario())
      .send({ terminalFontSize: 25 })
    expect(res.status).toBe(400)
  })

  test("rechaza un tema no soportado (400)", async () => {
    const res = await request(app)
      .put("/api/preferences")
      .set("Cookie", cookieUsuario())
      .send({ theme: "neon" })
    expect(res.status).toBe(400)
  })

  test("rechaza una familia tipografica fuera del catalogo (400)", async () => {
    const res = await request(app)
      .put("/api/preferences")
      .set("Cookie", cookieUsuario())
      .send({ terminalFontFamily: "Comic Sans MS" })
    expect(res.status).toBe(400)
  })

  test("aplica solo los campos enviados y devuelve las preferencias vigentes (200)", async () => {
    prisma.settings.upsert.mockResolvedValue(prefsBase)

    const res = await request(app)
      .put("/api/preferences")
      .set("Cookie", cookieUsuario())
      .send({ theme: "dark" })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      terminalFontSize: 16,
      terminalFontFamily: "monospace",
      theme: "dark",
    })
    expect(prisma.settings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: "user-1" },
        update: { theme: "dark" },
        create: expect.objectContaining({ user_id: "user-1", theme: "dark" }),
      }),
    )
    const upsertArg = prisma.settings.upsert.mock.calls[0][0]
    expect(upsertArg.update).not.toHaveProperty("terminal_font_size")
    expect(upsertArg.create).not.toHaveProperty("terminal_font_size")
  })

  test("sin campos en el cuerpo crea/lee el registro de preferencias (200)", async () => {
    prisma.settings.upsert.mockResolvedValue(prefsBase)

    const res = await request(app)
      .put("/api/preferences")
      .set("Cookie", cookieUsuario())
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.theme).toBe("dark")
    expect(prisma.settings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: "user-1" } }),
    )
  })
})
