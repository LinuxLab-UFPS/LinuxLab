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

const mockLessonEvaluator = {
  getBySlug: jest.fn(async () => ({ slug: "mensaje-oculto", title: "Mensaje oculto", checks: [] })),
  lastAttempt: jest.fn(async () => null),
  statusOf: jest.fn(async () => ({ passed: [], grades: {} })),
  evaluate: jest.fn(async () => ({ passed: true, score: 50, results: [] })),
  resetSandbox: jest.fn(async () => ({ ok: true })),
  personalize: jest.fn(),
  CHECKER: "checker.py",
  SETUP: "setup.sh",
  EVAL_TIMEOUT_MS: 30000,
}
jest.mock("../../src/services/lessonEvaluatorService", () => mockLessonEvaluator)

jest.mock("../../src/services/attemptService", () => ({
  listAttempts: jest.fn(async () => []),
  topicActivitiesTotal: jest.fn(async () => 0),
  passedTopicCountByEnrollment: jest.fn(async () => new Map()),
  statusOf: jest.fn(async () => ({ passed: [], grades: {} })),
}))

const mockStudentActivityService = {
  listMine: jest.fn(async () => [{ id: "22222222-2222-2222-2222-222222222222", title: "Actividad" }]),
  getForStudent: jest.fn(async () => ({ id: "22222222-2222-2222-2222-222222222222" })),
  checkForStudent: jest.fn(async () => ({ passed: false, score: 25, results: [] })),
  resetForStudent: jest.fn(async () => ({ ok: true })),
}
jest.mock("../../src/services/studentActivityService", () => mockStudentActivityService)

const mockSubmissionService = {
  createSubmission: jest.fn(async () => ({ id: "sub-1", status: "submitted" })),
}
jest.mock("../../src/services/submissionService", () => mockSubmissionService)

const mockGradebookService = {
  getMyGrades: jest.fn(async () => ({ grades: [] })),
}
jest.mock("../../src/services/gradebookService", () => mockGradebookService)

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

const ACTIVITY_ID = "22222222-2222-2222-2222-222222222222"
const enrolledStudent = () => sessionCookie({ id: "user-2", role: "student", hasEnrollment: true })
const unenrolledStudent = () => sessionCookie({ id: "user-3", role: "student", hasEnrollment: false })

describe("CU13/RF-17 — actividades del temario", () => {
  test("sin sesión responde 401", async () => {
    const res = await request(app).post("/api/activities/mensaje-oculto/check")
    expect(res.status).toBe(401)
  })

  test("sin matrícula activa responde 403 (requireEnrollment)", async () => {
    const res = await request(app)
      .post("/api/activities/mensaje-oculto/check")
      .set("Cookie", unenrolledStudent())
    expect(res.status).toBe(403)
  })

  test("consulta el estado de sus actividades del temario (200)", async () => {
    const res = await request(app)
      .get("/api/activities/mine/status")
      .set("Cookie", enrolledStudent())
    expect(res.status).toBe(200)
    expect(mockLessonEvaluator.statusOf).toHaveBeenCalledWith("user-2")
  })

  test("evalúa una actividad del temario y muestra el resultado por aserción (200)", async () => {
    const res = await request(app)
      .post("/api/activities/mensaje-oculto/check")
      .set("Cookie", enrolledStudent())
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("passed")
    expect(mockLessonEvaluator.evaluate).toHaveBeenCalledWith({
      slug: "mensaje-oculto",
      studentUserId: "user-2",
    })
  })

  test("reinicia el espacio de trabajo de una actividad del temario (200)", async () => {
    const res = await request(app)
      .post("/api/activities/mensaje-oculto/reset")
      .set("Cookie", enrolledStudent())
      .send({})
    expect(res.status).toBe(200)
    expect(mockLessonEvaluator.resetSandbox).toHaveBeenCalled()
  })
})

describe("CU17/CU18/CU20 — actividades de grupo del estudiante", () => {
  test("lista sus actividades de curso (200)", async () => {
    const res = await request(app)
      .get("/api/group-activities/mine")
      .set("Cookie", enrolledStudent())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test("consulta sus calificaciones (200)", async () => {
    const res = await request(app)
      .get("/api/group-activities/mine/grades")
      .set("Cookie", enrolledStudent())
    expect(res.status).toBe(200)
    expect(mockGradebookService.getMyGrades).toHaveBeenCalledWith("user-2")
  })

  test("comprueba una actividad automática de curso (200)", async () => {
    const res = await request(app)
      .post(`/api/group-activities/${ACTIVITY_ID}/check`)
      .set("Cookie", enrolledStudent())
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("score")
    expect(mockStudentActivityService.checkForStudent).toHaveBeenCalledWith("user-2", ACTIVITY_ID)
  })

  test("reinicia los archivos de la actividad (200)", async () => {
    const res = await request(app)
      .post(`/api/group-activities/${ACTIVITY_ID}/reset`)
      .set("Cookie", enrolledStudent())
    expect(res.status).toBe(200)
    expect(mockStudentActivityService.resetForStudent).toHaveBeenCalledWith("user-2", ACTIVITY_ID)
  })

  test("entrega una actividad de revisión manual (201)", async () => {
    const res = await request(app)
      .post(`/api/group-activities/${ACTIVITY_ID}/submit`)
      .set("Cookie", enrolledStudent())
    expect(res.status).toBe(201)
    expect(mockSubmissionService.createSubmission).toHaveBeenCalledWith("user-2", ACTIVITY_ID)
  })
})
