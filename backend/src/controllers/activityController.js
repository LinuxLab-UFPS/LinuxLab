const lessonEvaluatorService = require("../services/lessonEvaluatorService")
const groupActivityService = require("../services/groupActivityService")
const studentActivityService = require("../services/studentActivityService")
const submissionService = require("../services/submissionService")
const checkCatalogService = require("../services/checkCatalogService")
const gradebookService = require("../services/gradebookService")
const attemptService = require("../services/attemptService")
const asyncHandler = require("../utils/asyncHandler")

const getActivity = asyncHandler(async (req, res) => {
  const [activity, attempt, attempts] = await Promise.all([
    lessonEvaluatorService.getBySlug(req.params.slug),
    lessonEvaluatorService.lastAttempt({ slug: req.params.slug, studentUserId: req.user.id }),
    attemptService.listAttempts({ slug: req.params.slug, studentUserId: req.user.id }),
  ])
  res.json({ ...activity, lastAttempt: attempt, attempts })
})

const getCatalog = asyncHandler(async (_req, res) => {
  res.json(await checkCatalogService.getCatalog())
})

const getMyStatus = asyncHandler(async (req, res) => {
  // `passed` marca la tarjeta como completada y `scores` pinta la nota. Van
  // juntos en la misma llamada porque el catalogo los necesita a la vez para
  // cada tarjeta, y pedir el detalle de cada actividad seria una llamada por
  // tarjeta.
  const [passed, scores] = await Promise.all([
    lessonEvaluatorService.passedSlugs(req.user.id),
    lessonEvaluatorService.scoresBySlug(req.user.id),
  ])
  res.json({ passed, scores })
})

const resetActivity = asyncHandler(async (req, res) => {
  // Sin `force` sólo se prepara lo que falte: abrir la actividad no puede
  // borrar el trabajo a medias de quien vuelve a ella.
  res.json(
    await lessonEvaluatorService.resetSandbox({
      slug: req.params.slug,
      studentUserId: req.user.id,
      force: req.body?.force === true,
    }),
  )
})

const checkActivity = asyncHandler(async (req, res) => {
  res.json(await lessonEvaluatorService.evaluate({ slug: req.params.slug, studentUserId: req.user.id }))
})

// Lado estudiante: las actividades de curso (GroupActivity).

const getMyGroupActivities = asyncHandler(async (req, res) => {
  res.json(await studentActivityService.listMine(req.user.id))
})

const getMyGrades = asyncHandler(async (req, res) => {
  res.json(await gradebookService.getMyGrades(req.user.id))
})

const getGroupActivityForStudent = asyncHandler(async (req, res) => {
  res.json(await studentActivityService.getForStudent(req.user.id, req.params.id))
})

const checkGroupActivity = asyncHandler(async (req, res) => {
  res.json(await studentActivityService.checkForStudent(req.user.id, req.params.id))
})

const submitGroupActivity = asyncHandler(async (req, res) => {
  const result = await submissionService.createSubmission(req.user.id, req.params.id)
  res.status(201).json(result)
})

// Lado docente: CRUD de actividades de curso (GroupActivity).

const listGroupActivities = asyncHandler(async (req, res) => {
  res.json(
    await groupActivityService.listGroupActivities({
      groupId: req.params.id,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

const createGroupActivity = asyncHandler(async (req, res) => {
  const activity = await groupActivityService.createGroupActivity({
    groupId: req.params.id,
    teacherUserId: req.user.id,
    role: req.user.role,
    input: req.body,
  })
  res.status(201).json(activity)
})

const getGroupActivity = asyncHandler(async (req, res) => {
  res.json(
    await groupActivityService.getGroupActivity({
      groupId: req.params.id,
      activityId: req.params.activityId,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

const updateGroupActivity = asyncHandler(async (req, res) => {
  res.json(
    await groupActivityService.updateGroupActivity({
      groupId: req.params.id,
      activityId: req.params.activityId,
      teacherUserId: req.user.id,
      role: req.user.role,
      input: req.body,
    }),
  )
})

const enableGroupActivity = asyncHandler(async (req, res) => {
  res.json(
    await groupActivityService.setGroupActivityEnabled({
      groupId: req.params.id,
      activityId: req.params.activityId,
      teacherUserId: req.user.id,
      role: req.user.role,
      enabled: true,
    }),
  )
})

const disableGroupActivity = asyncHandler(async (req, res) => {
  res.json(
    await groupActivityService.setGroupActivityEnabled({
      groupId: req.params.id,
      activityId: req.params.activityId,
      teacherUserId: req.user.id,
      role: req.user.role,
      enabled: false,
    }),
  )
})

const extendGroupActivityDueDate = asyncHandler(async (req, res) => {
  res.json(
    await groupActivityService.extendGroupActivityDueDate({
      groupId: req.params.id,
      activityId: req.params.activityId,
      teacherUserId: req.user.id,
      role: req.user.role,
      dueDate: req.body?.dueDate,
    }),
  )
})

const getActivitySubmissions = asyncHandler(async (req, res) => {
  res.json(
    await groupActivityService.getActivitySubmissions({
      groupId: req.params.id,
      activityId: req.params.activityId,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

const getManualSubmissions = asyncHandler(async (req, res) => {
  res.json(
    await groupActivityService.getManualSubmissions({
      groupId: req.params.id,
      activityId: req.params.activityId,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

module.exports = {
  getCatalog,
  getActivity,
  getMyStatus,
  checkActivity,
  resetActivity,
  getMyGroupActivities,
  getMyGrades,
  getGroupActivityForStudent,
  checkGroupActivity,
  listGroupActivities,
  createGroupActivity,
  getGroupActivity,
  updateGroupActivity,
  enableGroupActivity,
  disableGroupActivity,
  extendGroupActivityDueDate,
  getActivitySubmissions,
  getManualSubmissions,
  submitGroupActivity,
}
