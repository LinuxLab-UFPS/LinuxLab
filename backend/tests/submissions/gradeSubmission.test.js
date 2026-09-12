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

jest.mock("../../src/services/sshService", () => ({
  execCommand: jest.fn(async () => ({ code: 0, stdout: "", stderr: "" })),
  createExecStream: jest.fn(),
}))

jest.mock("../../src/config/firebase-storage", () => ({}))
jest.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: jest.fn() }) }))
jest.mock("../../src/config/firebase-admin", () => ({}))

const GROUP_ID = "11111111-1111-1111-1111-111111111111"
const SUBMISSION_ID = "33333333-3333-3333-3333-333333333333"

let app
beforeAll(() => {
  app = require("../../src/app")
})
beforeEach(() => {
  jest.clearAllMocks()
})

const teacherCookie = () => sessionCookie({ id: "user-1", role: "teacher" })
const studentCookie = () => sessionCookie({ id: "user-2", role: "student", hasEnrollment: true })

function entrega(overrides = {}) {
  return {
    id: SUBMISSION_ID,
    status: "submitted",
    groupActivity: { id: "act-1", group_id: GROUP_ID, title: "Informe de práctica", max_score: 100 },
    enrollment: { student_id: "user-2" },
    manualDetail: null,
    ...overrides,
  }
}

describe("CU19/RF-27 — calificación de entregas manuales", () => {
  test("sin sesión responde 401", async () => {
    const res = await request(app)
      .patch(`/api/submissions/${SUBMISSION_ID}/grade`)
      .send({ score: 80 })
    expect(res.status).toBe(401)
  })

  test("un estudiante no puede calificar entregas (403)", async () => {
    const res = await request(app)
      .patch(`/api/submissions/${SUBMISSION_ID}/grade`)
      .set("Cookie", studentCookie())
      .send({ score: 80 })
    expect(res.status).toBe(403)
  })

  test("responde 404 si la entrega no existe", async () => {
    prisma.groupSubmission.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .patch(`/api/submissions/${SUBMISSION_ID}/grade`)
      .set("Cookie", teacherCookie())
      .send({ score: 80 })

    expect(res.status).toBe(404)
  })

  test("rechaza una calificación fuera del rango 0–100 (400)", async () => {
    prisma.groupSubmission.findUnique.mockResolvedValue(entrega())
    prisma.group.findUnique.mockResolvedValue({ id: GROUP_ID, teacher_id: "user-1" })

    const res = await request(app)
      .patch(`/api/submissions/${SUBMISSION_ID}/grade`)
      .set("Cookie", teacherCookie())
      .send({ score: 150 })

    expect(res.status).toBe(400)
    expect(prisma.groupSubmission.update).not.toHaveBeenCalled()
  })

  test("califica con retroalimentación y registra al docente (200)", async () => {
    prisma.groupSubmission.findUnique.mockResolvedValue(entrega())
    prisma.group.findUnique.mockResolvedValue({ id: GROUP_ID, teacher_id: "user-1" })
    prisma.groupSubmission.update.mockResolvedValue(entrega({ score: 88, status: "graded", passed: true }))
    prisma.submissionManualDetail.upsert.mockResolvedValue({})

    const res = await request(app)
      .patch(`/api/submissions/${SUBMISSION_ID}/grade`)
      .set("Cookie", teacherCookie())
      .send({ score: 88, feedback: "Buen informe, revisa el formato" })

    expect(res.status).toBe(200)
    expect(prisma.groupSubmission.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ score: 88, status: "graded", passed: true }) }),
    )
    expect(prisma.submissionManualDetail.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ feedback: "Buen informe, revisa el formato", graded_by: "user-1" }),
      }),
    )
    expect(mockAuditService.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "activity_graded" }),
    )
  })

  test("rechaza calificar una entrega de un grupo ajeno (403)", async () => {
    prisma.groupSubmission.findUnique.mockResolvedValue(entrega())
    prisma.group.findUnique.mockResolvedValue({ id: GROUP_ID, teacher_id: "otro-docente" })

    const res = await request(app)
      .patch(`/api/submissions/${SUBMISSION_ID}/grade`)
      .set("Cookie", teacherCookie())
      .send({ score: 80 })

    expect(res.status).toBe(403)
  })
})
