const auditQueryService = require("../services/auditQueryService")
const asyncHandler = require("../utils/asyncHandler")

const listAuditEvents = asyncHandler(async (req, res) => {
  const { eventType, groupId, from, to, search, page, limit } = req.query
  res.json(
    await auditQueryService.listAuditEvents({
      role: req.user.role,
      userId: req.user.id,
      filters: { eventType, groupId, from, to, search, page, limit },
    }),
  )
})

const listGroupAuditEvents = asyncHandler(async (req, res) => {
  res.json(
    await auditQueryService.listGroupAuditEvents({
      groupId: req.params.id,
      role: req.user.role,
      userId: req.user.id,
      limit: Number(req.query.limit) || 10,
    }),
  )
})

module.exports = { listAuditEvents, listGroupAuditEvents }
