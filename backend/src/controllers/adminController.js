const userService = require("../services/userService")
const reconcileService = require("../services/reconcileService")
const environmentService = require("../services/environmentService")
const jobService = require("../services/jobService")
const asyncHandler = require("../utils/asyncHandler")

const listTeachers = asyncHandler(async (req, res) => {
  const { search, status } = req.query
  res.json(await userService.findAll({ search, status }))
})

const registerTeacher = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  res.status(201).json(await userService.register({ name, email }))
})

const toggleTeacherStatus = asyncHandler(async (req, res) => {
  res.json(await userService.toggleActive(req.params.id))
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
  toggleTeacherStatus,
  reconcileAll,
  environmentSnapshot,
  requeueFailed,
  ensureOwnAccount,
  listTeacherProvisioningJobs,
}
