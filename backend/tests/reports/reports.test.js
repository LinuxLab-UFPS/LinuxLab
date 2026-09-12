const request = require("supertest")
const { sessionCookie } = require("../helpers/session")

jest.mock("../../prisma/client", () => {
  const { createPrismaMock } = require("../helpers/prisma-mock")
  return createPrismaMock()
})

jest.mock("../../src/services/sshService", () => ({
  execCommand: jest.fn(async () => ({ code: 0, stdout: "", stderr: "" })),
  createExecStream: jest.fn(),
}))

jest.mock("../../src/services/auditService", () => ({
  audit: jest.fn(async () => ({})),
  requestMeta: jest.fn(() => ({ ip: "127.0.0.1", userAgent: "jest", actorRole: null })),
}))

const mockGradebookService = {
  getGroupGradebook: jest.fn(async () => ({ activities: [], students: [], activityAverages: {} })),
  getStudentPerformance: jest.fn(async () => ({ student: { id: "user-2" }, series: [] })),
}
jest.mock("../../src/services/gradebookService", () => mockGradebookService)

const mockGroupProgressService = {
  getGroupProgress: jest.fn(async () => ({ topics: [], students: [] })),
}
jest.mock("../../src/services/groupProgressService", () => mockGroupProgressService)

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

const teacherCookie = () => sessionCookie({ id: "user-1", role: "teacher" })
const studentCookie = () => sessionCookie({ id: "user-2", role: "student", hasEnrollment: true })

describe("CU21/CU22/RF-30, RF-31 — seguimiento y cuaderno de calificaciones", () => {
  test("sin sesión responde 401", async () => {
    const res = await request(app).get(`/api/groups/${GROUP_ID}/gradebook`)
    expect(res.status).toBe(401)
  })

  test("un estudiante no accede al cuaderno del grupo (403)", async () => {
    const res = await request(app)
      .get(`/api/groups/${GROUP_ID}/gradebook`)
      .set("Cookie", studentCookie())
    expect(res.status).toBe(403)
  })

  test("el docente consulta el cuaderno de calificaciones (200)", async () => {
    const res = await request(app)
      .get(`/api/groups/${GROUP_ID}/gradebook`)
      .set("Cookie", teacherCookie())
    expect(res.status).toBe(200)
    expect(mockGradebookService.getGroupGradebook).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: GROUP_ID, teacherUserId: "user-1", role: "teacher" }),
    )
  })

  test("el docente consulta el rendimiento de un estudiante (200)", async () => {
    const res = await request(app)
      .get(`/api/groups/${GROUP_ID}/gradebook/students/user-2`)
      .set("Cookie", teacherCookie())
    expect(res.status).toBe(200)
    expect(mockGradebookService.getStudentPerformance).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: GROUP_ID, studentId: "user-2" }),
    )
  })

  test("el docente consulta el avance del grupo (200)", async () => {
    const res = await request(app)
      .get(`/api/groups/${GROUP_ID}/progress`)
      .set("Cookie", teacherCookie())
    expect(res.status).toBe(200)
    expect(mockGroupProgressService.getGroupProgress).toHaveBeenCalled()
  })

  test("un estudiante no accede al avance del grupo (403)", async () => {
    const res = await request(app)
      .get(`/api/groups/${GROUP_ID}/progress`)
      .set("Cookie", studentCookie())
    expect(res.status).toBe(403)
  })
})
