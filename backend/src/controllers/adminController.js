const teacherService = require("../services/teacherService")
const logger = require("../lib/logger")

const { ServiceError } = teacherService

async function listTeachers(req, res) {
  try {
    const { search, status } = req.query
    const teachers = await teacherService.findAll({ search, status })
    res.json(teachers)
  } catch (error) {
    logger.error({ err: error }, "Error listing teachers")
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

async function registerTeacher(req, res) {
  try {
    const { name, email } = req.body
    const teacher = await teacherService.register({ name, email })
    res.status(201).json(teacher)
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ error: error.message })
    }
    logger.error({ err: error }, "Error registering teacher")
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

async function toggleTeacherStatus(req, res) {
  try {
    const { id } = req.params
    const teacher = await teacherService.toggleActive(id)
    res.json(teacher)
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ error: error.message })
    }
    logger.error({ err: error }, "Error toggling teacher status")
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = { listTeachers, registerTeacher, toggleTeacherStatus }
