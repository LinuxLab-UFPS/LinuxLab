const teacherService = require("../services/teacherService")
const reconcileService = require("../services/reconcileService")
const environmentService = require("../services/environmentService")
const asyncHandler = require("../utils/asyncHandler")

const listTeachers = asyncHandler(async (req, res) => {
  const { search, status } = req.query
  res.json(await teacherService.findAll({ search, status }))
})

const registerTeacher = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  res.status(201).json(await teacherService.register({ name, email }))
})

const toggleTeacherStatus = asyncHandler(async (req, res) => {
  res.json(await teacherService.toggleActive(req.params.id))
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

module.exports = {
  listTeachers,
  registerTeacher,
  toggleTeacherStatus,
  reconcileAll,
  environmentSnapshot,
  requeueFailed,
  ensureOwnAccount,
}
