const groupService = require("../services/groupService")
const enrollmentService = require("../services/enrollmentService")
const activityService = require("../services/activityService")
const reconcileService = require("../services/reconcileService")
const prisma = require("../../prisma/client")
const asyncHandler = require("../utils/asyncHandler")

const createGroup = asyncHandler(async (req, res) => {
  const { name, description, students } = req.body
  const group = await groupService.createGroup({
    name,
    description,
    students: Array.isArray(students) ? students : [],
    teacherUserId: req.user.id,
  })
  res.status(201).json(group)
})

const listGroups = asyncHandler(async (req, res) => {
  const groups = await groupService.listGroups({
    teacherUserId: req.user.id,
    role: req.user.role,
  })
  res.json(groups)
})

const getGroup = asyncHandler(async (req, res) => {
  const group = await groupService.getGroup({
    groupId: req.params.id,
    teacherUserId: req.user.id,
    role: req.user.role,
  })
  res.json(group)
})

const archiveGroup = asyncHandler(async (req, res) => {
  const group = await groupService.archiveGroup({
    groupId: req.params.id,
    role: req.user.role,
    teacherUserId: req.user.id,
  })
  res.json(group)
})

const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, code } = req.body
  const outcome = await enrollmentService.registerStudent({
    groupId: req.params.id,
    name,
    email,
    code,
    teacherUserId: req.user.id,
    role: req.user.role,
  })
  res.status(outcome.enrolled ? 201 : 200).json(outcome)
})

const deleteGroup = asyncHandler(async (req, res) => {
  await groupService.deleteGroup({
    groupId: req.params.id,
    role: req.user.role,
    teacherUserId: req.user.id,
  })
  res.status(204).end()
})

const importCsv = asyncHandler(async (req, res) => {
  const summary = await enrollmentService.importCsv({
    groupId: req.params.id,
    csvText: typeof req.body === "string" ? req.body : "",
    teacherUserId: req.user.id,
    role: req.user.role,
  })
  res.json(summary)
})

const listStudents = asyncHandler(async (req, res) => {
  const students = await enrollmentService.listByGroup({
    groupId: req.params.id,
    teacherUserId: req.user.id,
    role: req.user.role,
  })
  res.json(students)
})

const listProvisioningJobs = asyncHandler(async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { group_id: req.params.id },
    select: { student: { select: { id: true } } },
  })
  const userIds = enrollments.map((enrollment) => enrollment.student.id)
  const jobs = await prisma.userProvisioningJob.findMany({
    where: { user_id: { in: userIds } },
    include: {
      user: {
        select: { name: true, email: true, code: true },
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
    student: {
      name: job.user.name,
      email: job.user.email,
      code: job.user.code ?? null,
    },
    createdAt: job.created_at,
  })))
})

const reconcileGroup = asyncHandler(async (req, res) => {
  await groupService.getGroupAccess({
    groupId: req.params.id,
    teacherUserId: req.user.id,
    role: req.user.role,
  })
  const outcome = await reconcileService.reconcileGroup({ groupId: req.params.id })
  res.json(outcome)
})

const listGroupActivities = asyncHandler(async (req, res) => {
  res.json(
    await activityService.listGroupActivities({
      groupId: req.params.id,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

const createGroupActivity = asyncHandler(async (req, res) => {
  const activity = await activityService.createGroupActivity({
    groupId: req.params.id,
    teacherUserId: req.user.id,
    role: req.user.role,
    input: req.body,
  })
  res.status(201).json(activity)
})

const getGroupActivity = asyncHandler(async (req, res) => {
  res.json(
    await activityService.getGroupActivity({
      groupId: req.params.id,
      activityId: req.params.activityId,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

module.exports = {
  createGroup,
  listGroups,
  getGroup,
  archiveGroup,
  deleteGroup,
  registerStudent,
  importCsv,
  listStudents,
  listProvisioningJobs,
  reconcileGroup,
  listGroupActivities,
  createGroupActivity,
  getGroupActivity,
}
