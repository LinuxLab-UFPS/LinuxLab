const { Role } = require("@prisma/client")
const prisma = require("../../prisma/client")
const { sanitizeUsername } = require("../utils/sanitizeUsername")

class ServiceError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INSTITUTIONAL_DOMAIN = "@ufps.edu.co"

const TEACHER_SELECT = {
  id: true,
  name: true,
  email: true,
  active: true,
  linuxAccount: {
    select: {
      linux_username: true,
      linux_provisioned: true,
    },
  },
  teacher: {
    select: { user_id: true },
  },
}

function serializeTeacher(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.active,
    linuxUsername: user.linuxAccount?.linux_username ?? null,
    linuxProvisioned: user.linuxAccount?.linux_provisioned ?? false,
  }
}

async function findAll(filters = {}) {
  const where = { role: Role.teacher, teacher: { isNot: null } }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.status === "active") where.active = true
  if (filters.status === "inactive") where.active = false

  const users = await prisma.user.findMany({
    where,
    select: TEACHER_SELECT,
    orderBy: { created_at: "desc" },
  })
  return users.map(serializeTeacher)
}

async function register({ name, email }) {
  if (!name?.trim()) {
    throw new ServiceError("El nombre del docente es requerido", 400)
  }
  if (!email?.trim()) {
    throw new ServiceError("El correo electrónico es requerido", 400)
  }

  const normalizedEmail = email.toLowerCase().trim()

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ServiceError("El formato del correo electrónico no es válido", 400)
  }

  if (!normalizedEmail.endsWith(INSTITUTIONAL_DOMAIN)) {
    throw new ServiceError("Solo se permiten correos institucionales @ufps.edu.co", 400)
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    throw new ServiceError("El correo electrónico ya está registrado en la plataforma", 409)
  }

  const linuxUsername = sanitizeUsername(normalizedEmail)

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      role: Role.teacher,
      active: true,
      teacher: { create: {} },
      linuxAccount: {
        create: {
          linux_username: linuxUsername,
          linux_provisioned: false,
        },
      },
    },
    select: TEACHER_SELECT,
  })

  return serializeTeacher(user)
}

async function toggleActive(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, active: true },
  })

  if (!user || user.role !== Role.teacher) {
    throw new ServiceError("Docente no encontrado", 404)
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { active: !user.active },
    select: TEACHER_SELECT,
  })
  return serializeTeacher(updated)
}

module.exports = { findAll, register, toggleActive, ServiceError, serializeTeacher }
