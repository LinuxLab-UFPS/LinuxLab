const userService = require("../services/userService")
const reconcileService = require("../services/reconcileService")
const environmentService = require("../services/environmentService")
const jobService = require("../services/jobService")
const auditService = require("../services/auditService")
const authService = require("../services/authService")
const logger = require("../lib/logger")
const asyncHandler = require("../utils/asyncHandler")

const listTeachers = asyncHandler(async (req, res) => {
  const { search, status } = req.query
  res.json(await userService.findAll({ search, status }))
})

const registerTeacher = asyncHandler(async (req, res) => {
  const { name, email, code } = req.body
  const teacher = await userService.register({ name, email, code })
  const { ip, userAgent, actorRole } = auditService.requestMeta(req)
  auditService.audit({
    userId: req.user.id,
    eventType: "teacher_registered",
    target: teacher.email,
    metadata: { teacherId: teacher.id, name: teacher.name },
    actorRole: actorRole ?? req.user.role,
    ip,
    userAgent,
  })
  let debugLink
  try {
    ;({ debugLink } = await authService.inviteTeacher({ email: teacher.email, name: teacher.name }))
  } catch (e) {
    logger.error({ err: e, email }, "No se pudo enviar la invitación, pero el docente quedó registrado")
  }
  res.status(201).json({ ...teacher, debugLink })
})

const resendTeacherInvite = asyncHandler(async (req, res) => {
  const teacher = await userService.findById(req.params.id)
  const { debugLink } = await authService.inviteTeacher({ email: teacher.email, name: teacher.name })
  res.json({ message: "Invitación reenviada", debugLink })
})

const toggleTeacherStatus = asyncHandler(async (req, res) => {
  const teacher = await userService.toggleActive(req.params.id)
  const { ip, userAgent, actorRole } = auditService.requestMeta(req)
  auditService.audit({
    userId: req.user.id,
    eventType: "teacher_toggled",
    target: teacher.email,
    metadata: { teacherId: teacher.id, active: teacher.active },
    actorRole: actorRole ?? req.user.role,
    ip,
    userAgent,
  })
  res.json(teacher)
})

const reconcileAll = asyncHandler(async (req, res) => {
  res.json(await reconcileService.reconcileAll())
})

const environmentSnapshot = asyncHandler(async (req, res) => {
  res.json(await environmentService.snapshot())
})

const requeueFailed = asyncHandler(async (req, res) => {
  res.json(await environmentService.requeueFailed())
})

const ensureOwnAccount = asyncHandler(async (req, res) => {
  res.json(await environmentService.ensureOwnAccount(req.user.id))
})

const listTeacherProvisioningJobs = asyncHandler(async (_req, res) => {
  res.json(await jobService.listTeacherProvisioningJobs())
})

module.exports = {
  listTeachers,
  registerTeacher,
  resendTeacherInvite,
  toggleTeacherStatus,
  reconcileAll,
  environmentSnapshot,
  requeueFailed,
  ensureOwnAccount,
  listTeacherProvisioningJobs,
}
