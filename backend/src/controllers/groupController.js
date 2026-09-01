const groupService = require("../services/groupService")
const enrollmentService = require("../services/enrollmentService")
const reconcileService = require("../services/reconcileService")
const gradebookService = require("../services/gradebookService")
const groupProgressService = require("../services/groupProgressService")
const finalizationService = require("../services/finalizationService")
const certificateService = require("../services/certificateService")
const accessService = require("../services/accessService")
const asyncHandler = require("../utils/asyncHandler")
const { sendPdf } = require("../utils/pdfResponse")

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

const rotateInvite = asyncHandler(async (req, res) => {
  res.json(
    await groupService.rotateInvite({
      groupId: req.params.id,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
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

const getGradebook = asyncHandler(async (req, res) => {
  res.json(
    await gradebookService.getGroupGradebook({
      groupId: req.params.id,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

const getStudentPerformance = asyncHandler(async (req, res) => {
  res.json(
    await gradebookService.getStudentPerformance({
      groupId: req.params.id,
      studentId: req.params.studentId,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

const getGroupProgress = asyncHandler(async (req, res) => {
  res.json(
    await groupProgressService.getGroupProgress({
      groupId: req.params.id,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

const finalizePreview = asyncHandler(async (req, res) => {
  res.json(
    await finalizationService.finalizationSummary({
      groupId: req.params.id,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

const listCertificates = asyncHandler(async (req, res) => {
  res.json(
    await certificateService.listByGroup({
      groupId: req.params.id,
      teacherUserId: req.user.id,
      role: req.user.role,
    }),
  )
})

const actaPdf = asyncHandler(async (req, res) => {
  const { buffer, filename } = await certificateService.actaPdf({
    groupId: req.params.id,
    teacherUserId: req.user.id,
    role: req.user.role,
  })
  sendPdf(res, buffer, filename)
})

module.exports = {
  createGroup,
  listGroups,
  getGroup,
  archiveGroup,
  rotateInvite,
  deleteGroup,
  registerStudent,
  importCsv,
  listStudents,
  listProvisioningJobs,
  teacherProvisioningStatus,
  reconcileGroup,
  getGradebook,
  getStudentPerformance,
  getGroupProgress,
  finalizePreview,
  listCertificates,
  actaPdf,
}
