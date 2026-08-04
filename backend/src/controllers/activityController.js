const activityService = require("../services/activityService")
const asyncHandler = require("../utils/asyncHandler")

const getActivity = asyncHandler(async (req, res) => {
  const [activity, attempt] = await Promise.all([
    activityService.getBySlug(req.params.slug),
    activityService.lastAttempt({ slug: req.params.slug, studentUserId: req.user.id }),
  ])
  res.json({ ...activity, lastAttempt: attempt })
})

const checkActivity = asyncHandler(async (req, res) => {
  res.json(await activityService.evaluate({ slug: req.params.slug, studentUserId: req.user.id }))
})

module.exports = { getActivity, checkActivity }
