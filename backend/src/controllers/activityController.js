const activityService = require("../services/activityService")
const asyncHandler = require("../utils/asyncHandler")

const getActivity = asyncHandler(async (req, res) => {
  const [activity, attempt] = await Promise.all([
    activityService.getBySlug(req.params.slug),
    activityService.lastAttempt({ slug: req.params.slug, studentUserId: req.user.id }),
  ])
  res.json({ ...activity, lastAttempt: attempt })
})

const getCatalog = asyncHandler(async (_req, res) => {
  res.json(await activityService.getCatalog())
})

const getMyStatus = asyncHandler(async (req, res) => {
  res.json({ passed: await activityService.passedSlugs(req.user.id) })
})

const resetActivity = asyncHandler(async (req, res) => {
  // Sin `force` sólo se prepara lo que falte: abrir la actividad no puede
  // borrar el trabajo a medias de quien vuelve a ella.
  res.json(
    await activityService.resetSandbox({
      slug: req.params.slug,
      studentUserId: req.user.id,
      force: req.body?.force === true,
    }),
  )
})

const checkActivity = asyncHandler(async (req, res) => {
  res.json(await activityService.evaluate({ slug: req.params.slug, studentUserId: req.user.id }))
})

module.exports = { getCatalog, getActivity, getMyStatus, checkActivity, resetActivity }
