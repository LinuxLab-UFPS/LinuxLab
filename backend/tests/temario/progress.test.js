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

const cookieEstudiante = () =>
  sessionCookie({ id: "user-1", role: "student", hasEnrollment: true })

describe("CU11 — navegacion del temario y registro de lectura", () => {
  test("POST /api/lessons/:topicSlug/:subtopicId/view sin sesion responde 401", async () => {
    const res = await request(app).post("/api/lessons/tema-1/leccion-1/view")
    expect(res.status).toBe(401)
  })

  test("responde 404 cuando el subtema no existe", async () => {
    prisma.subtopic.findFirst.mockResolvedValue(null)
    prisma.enrollment.findMany.mockResolvedValue([{ id: "e1" }])

    const res = await request(app)
      .post("/api/lessons/tema-1/inexistente/view")
      .set("Cookie", cookieEstudiante())

    expect(res.status).toBe(404)
    expect(prisma.lessonView.upsert).not.toHaveBeenCalled()
  })

  test("responde 404 cuando el subtema no pertenece al tema de la URL", async () => {
    prisma.subtopic.findFirst.mockResolvedValue({
      id: "sub-1",
      topic: { slug: "otro-tema" },
    })
    prisma.enrollment.findMany.mockResolvedValue([{ id: "e1" }])

    const res = await request(app)
      .post("/api/lessons/tema-1/sub-1/view")
      .set("Cookie", cookieEstudiante())

    expect(res.status).toBe(404)
    expect(prisma.lessonView.upsert).not.toHaveBeenCalled()
  })

  test("responde 409 si el estudiante no tiene matricula activa (RF-05)", async () => {
    prisma.subtopic.findFirst.mockResolvedValue({
      id: "sub-1",
      topic: { slug: "tema-1" },
    })
    prisma.enrollment.findMany.mockResolvedValue([])

    const res = await request(app)
      .post("/api/lessons/tema-1/sub-1/view")
      .set("Cookie", cookieEstudiante())

    expect(res.status).toBe(409)
    expect(prisma.lessonView.upsert).not.toHaveBeenCalled()
  })

  test("registra la lectura en todas las matriculas activas del estudiante (204)", async () => {
    prisma.subtopic.findFirst.mockResolvedValue({
      id: "sub-1",
      topic: { slug: "tema-1" },
    })
    prisma.enrollment.findMany.mockResolvedValue([{ id: "e1" }, { id: "e2" }])
    prisma.subtopic.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post("/api/lessons/tema-1/sub-1/view")
      .set("Cookie", cookieEstudiante())

    expect(res.status).toBe(204)
    expect(prisma.lessonView.upsert).toHaveBeenCalledTimes(2)
    expect(prisma.lessonView.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { enrollment_id_subtopic_id: { enrollment_id: "e1", subtopic_id: "sub-1" } },
      }),
    )
    expect(prisma.lessonView.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { enrollment_id_subtopic_id: { enrollment_id: "e2", subtopic_id: "sub-1" } },
      }),
    )
  })
})

describe("CU11 — consulta del avance del temario", () => {
  test("GET /api/progress sin sesion responde 401", async () => {
    const res = await request(app).get("/api/progress")
    expect(res.status).toBe(401)
  })

  test("sin matricula devuelve el estado vacio", async () => {
    prisma.enrollment.findFirst.mockResolvedValue(null)

    const res = await request(app)
      .get("/api/progress")
      .set("Cookie", cookieEstudiante())

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ topicProgress: [], readKeys: [], group: null, activities: [] })
  })

  test("con matricula devuelve temas, lecturas, grupo y actividades", async () => {
    prisma.enrollment.findFirst.mockResolvedValue({
      id: "e1",
      group: { id: "g1", name: "Curso Linux" },
    })
    prisma.topicProgress.findMany.mockResolvedValue([
      {
        topic_id: "t1",
        topic: { order_number: 1, title: "Tema 1" },
        completed: true,
        completed_at: new Date("2026-07-01T00:00:00.000Z"),
      },
    ])
    prisma.lessonView.findMany.mockResolvedValue([
      { subtopic: { slug: "leccion-1", topic: { order_number: 1 } } },
    ])
    prisma.groupActivity.findMany.mockResolvedValue([])

    const res = await request(app)
      .get("/api/progress")
      .set("Cookie", cookieEstudiante())

    expect(res.status).toBe(200)
    expect(res.body.readKeys).toEqual(["1/leccion-1"])
    expect(res.body.topicProgress).toHaveLength(1)
    expect(res.body.topicProgress[0]).toMatchObject({
      topicId: "t1",
      topicNumber: 1,
      title: "Tema 1",
      completed: true,
    })
    expect(res.body.group).toEqual({ id: "g1", name: "Curso Linux" })
    expect(Array.isArray(res.body.activities)).toBe(true)
  })
})
