const asyncHandler = require("../utils/asyncHandler")
const progressService = require("../services/progressService")

/** Resumen del grupo para el panel de seguimiento (docente/admin). */
const getGroupProgress = asyncHandler(async (req, res) => {
  res.json(
    await progressService.getGroupProgress({
      groupId: req.params.id,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

/** Detalle de progreso de un estudiante en el grupo (docente/admin). */
const getStudentGroupDetail = asyncHandler(async (req, res) => {
  res.json(
    await progressService.getStudentGroupDetail({
      groupId: req.params.id,
      studentId: req.params.studentId,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

/** Progreso del estudiante en su grupo activo. */
const getMyProgress = asyncHandler(async (req, res) => {
  res.json(await progressService.getMyProgress({ userId: req.user.id }))
})

/** Marca una lección como leída en el grupo activo del estudiante. */
const markLessonRead = asyncHandler(async (req, res) => {
  res.json(
    await progressService.markLessonRead({
      userId: req.user.id,
      topicNumber: req.body?.topicNumber,
      subtopicSlug: req.body?.subtopicSlug,
    }),
  )
})

/** Lecciones leídas del estudiante en su grupo activo. */
const getMyReadLessons = asyncHandler(async (req, res) => {
  res.json(await progressService.getMyReadLessons({ userId: req.user.id }))
})

module.exports = {
  getGroupProgress,
  getStudentGroupDetail,
  getMyProgress,
  getMyReadLessons,
  markLessonRead,
}