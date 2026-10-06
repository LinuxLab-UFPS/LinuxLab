const teacherRequestService = require("../services/teacherRequestService")
const auditService = require("../services/auditService")
const asyncHandler = require("../utils/asyncHandler")

const create = asyncHandler(async (req, res) => {
  const { name, email, code } = req.body ?? {}
  const request = await teacherRequestService.create({ name, email, code })
  res.status(201).json(request)
})

const list = asyncHandler(async (req, res) => {
  res.json(await teacherRequestService.list({ status: req.query.status }))
})

const count = asyncHandler(async (_req, res) => {
  res.json({ pending: await teacherRequestService.pendingCount() })
})

function reviewMeta(req) {
  const { ip, userAgent, actorRole } = auditService.requestMeta(req)
  return { ip, userAgent, actorRole: actorRole ?? req.user.role }
}

const approve = asyncHandler(async (req, res) => {
  const result = await teacherRequestService.approve({
    id: req.params.id,
    adminUserId: req.user.id,
    meta: reviewMeta(req),
  })
  res.json({ ...result.teacher, debugLink: result.debugLink })
})

const reject = asyncHandler(async (req, res) => {
  res.json(
    await teacherRequestService.reject({
      id: req.params.id,
      adminUserId: req.user.id,
      meta: reviewMeta(req),
    }),
  )
})

module.exports = { create, list, count, approve, reject }
