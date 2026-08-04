const teacherService = require("../services/teacherService")
const reconcileService = require("../services/reconcileService")
const environmentService = require("../services/environmentService")
const asyncHandler = require("../utils/asyncHandler")
const prisma = require("../../prisma/client")

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

const listTeacherProvisioningJobs = asyncHandler(async (req, res) => {
  const teachers = await prisma.user.findMany({
    where: { role: "teacher" },
    select: { id: true },
  })
  const teacherIds = teachers.map((t) => t.id)
  const jobs = await prisma.userProvisioningJob.findMany({
    where: {
      user_id: { in: teacherIds },
      group_id: null,
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { created_at: "desc" },
  })
  res.json(jobs.map((job) => ({
    id: job.id,
    username: job.username,
    status: job.status,
    retries: job.retries,
    error: job.error,
    teacher: {
      name: job.user.name,
      email: job.user.email,
    },
    createdAt: job.created_at,
  })))
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
