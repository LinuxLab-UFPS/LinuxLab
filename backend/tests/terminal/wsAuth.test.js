jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

jest.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: jest.fn() }) }))
jest.mock("../../src/config/firebase-admin", () => ({}))
jest.mock("../../src/config/firebase-storage", () => ({}))

const wsAuth = require("../../src/gateway/wsAuthMiddleware")
const { sessionCookie } = require("../helpers/session")

describe("CU14 — autenticacion del WebSocket de terminal", () => {
  test("rechaza la conexion sin cookie de sesion", () => {
    const outcome = wsAuth({ headers: {} })
    expect(outcome.error).toMatch(/session not found/i)
    expect(outcome.user).toBeUndefined()
  })

  test("rechaza una cookie con firma invalida", () => {
    const outcome = wsAuth({ headers: { cookie: "token=firma-falsa" } })
    expect(outcome.error).toMatch(/invalid or expired/i)
    expect(outcome.user).toBeUndefined()
  })

  test("acepta una cookie valida y resuelve el usuario de la sesion", () => {
    const cookie = sessionCookie({ id: "user-1", role: "student", hasEnrollment: true })

    const outcome = wsAuth({ headers: { cookie } })

    expect(outcome.error).toBeUndefined()
    expect(outcome.user).toMatchObject({ id: "user-1", role: "student" })
  })

  test("encuentra la cookie de sesion entre otras cookies", () => {
    const cookie = sessionCookie({ id: "user-1", role: "student", hasEnrollment: true })

    const outcome = wsAuth({ headers: { cookie: `tema=oscuro; ${cookie}; idioma=es` } })

    expect(outcome.error).toBeUndefined()
    expect(outcome.user.id).toBe("user-1")
  })
})
