const groupService = require("../services/groupService")
const enrollmentService = require("../services/enrollmentService")
const reconcileService = require("../services/reconcileService")
const accessService = require("../services/accessService")
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
  res.json(
    await groupService.listGroupProvisioningJobs({
      groupId: req.params.id,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

/** Resumen global de aprovisionamiento del docente, para el indicador de UI. */
const teacherProvisioningStatus = asyncHandler(async (req, res) => {
  res.json(
    await groupService.teacherProvisioningSummary({
      teacherUserId: req.user.id,
    }),
  )
})

const reconcileGroup = asyncHandler(async (req, res) => {
  await accessService.ensureGroupAccess({
    groupId: req.params.id,
    teacherUserId: req.user.id,
    role: req.user.role,
  })
  const outcome = await reconcileService.reconcileGroup({ groupId: req.params.id })
  res.json(outcome)
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
  teacherProvisioningStatus,
  reconcileGroup,
}
