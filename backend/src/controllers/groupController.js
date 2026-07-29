const groupService = require("../services/groupService")
const enrollmentService = require("../services/enrollmentService")
const prisma = require("../../prisma/client")

function handleError(res, err) {
  if (err instanceof groupService.ServiceError || err instanceof enrollmentService.ServiceError) {
    return res.status(err.status).json({ error: err.message })
  }
  console.error("Unexpected error:", err)
  return res.status(500).json({ error: "Error interno del servidor" })
}

async function createGroup(req, res) {
  try {
    const { name, description, students } = req.body
    const group = await groupService.createGroup({
      name,
      description,
      students: Array.isArray(students) ? students : [],
      teacherUserId: req.user.id,
    })
    res.status(201).json(group)
  } catch (err) {
    handleError(res, err)
  }
}

async function listGroups(req, res) {
  try {
    const groups = await groupService.listGroups({
      teacherUserId: req.user.id,
      role: req.user.role,
    })
    res.json(groups)
  } catch (err) {
    handleError(res, err)
  }
}

async function getGroup(req, res) {
  try {
    const { id } = req.params
    const group = await groupService.getGroup({
      groupId: id,
      teacherUserId: req.user.id,
      role: req.user.role,
    })
    res.json(group)
  } catch (err) {
    handleError(res, err)
  }
}

async function archiveGroup(req, res) {
  try {
    const { id } = req.params
    const group = await groupService.archiveGroup({
      groupId: id,
      role: req.user.role,
      teacherUserId: req.user.id,
    })
    res.json(group)
  } catch (err) {
    handleError(res, err)
  }
}

async function registerStudent(req, res) {
  try {
    const { id } = req.params
    const { name, email, code } = req.body
    const outcome = await enrollmentService.registerStudent({
      groupId: id,
      name,
      email,
      code,
      teacherUserId: req.user.id,
      role: req.user.role,
    })
    res.status(outcome.enrolled ? 201 : 200).json(outcome)
  } catch (err) {
    handleError(res, err)
  }
}

async function importCsv(req, res) {
  try {
    const { id } = req.params
    const summary = await enrollmentService.importCsv({
      groupId: id,
      csvText: typeof req.body === "string" ? req.body : "",
      teacherUserId: req.user.id,
      role: req.user.role,
    })
    res.json(summary)
  } catch (err) {
    handleError(res, err)
  }
}

async function listStudents(req, res) {
  try {
    const { id } = req.params
    const students = await enrollmentService.listByGroup({
      groupId: id,
      teacherUserId: req.user.id,
      role: req.user.role,
    })
    res.json(students)
  } catch (err) {
    handleError(res, err)
  }
}

async function listProvisioningJobs(req, res) {
  try {
    const { id } = req.params
    const enrollments = await prisma.enrollment.findMany({
      where: { group_id: id },
      select: { student: { select: { user_id: true } } },
    })
    const userIds = enrollments.map((e) => e.student.user_id)
    const jobs = await prisma.userProvisioningJob.findMany({
      where: { user_id: { in: userIds } },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            student: { select: { code: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    })
    res.json(
      jobs.map((j) => ({
        id: j.id,
        username: j.username,
        status: j.status,
        retries: j.retries,
        error: j.error,
        student: {
          name: j.user.name,
          email: j.user.email,
          code: j.user.student?.code ?? null,
        },
        createdAt: j.created_at,
      })),
    )
  } catch (err) {
    handleError(res, err)
  }
}

module.exports = {
  createGroup,
  listGroups,
  getGroup,
  archiveGroup,
  registerStudent,
  importCsv,
  listStudents,
  listProvisioningJobs,
}
