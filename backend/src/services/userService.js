const { Role } = require("@prisma/client")
const prisma = require("../../prisma/client")
const { sanitizeUsername } = require("../utils/sanitizeUsername")
const { AppError } = require("../lib/errors")
const { runInTransaction } = require("../lib/transaction")
const { registerTeacherSchema } = require("../dtos/userDtos")
const { parseOrThrow } = require("../dtos/common")
const { serializeTeacher } = require("../dtos/userDtos")
const { PRIORITIES } = require("../lib/constants")

const TEACHER_SELECT = {
  id: true,
  name: true,
  email: true,
  active: true,
  teacher: { select: { code: true } },
  linuxAccount: {
    select: {
      linux_username: true,
      linux_provisioned: true,
    },
  },
}

async function findAll(filters = {}) {
  const where = { teacher: { isNot: null } }

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

async function register(args) {
  // La validacion de forma (nombre, email, codigo) ocurre antes de abrir la
  // transaccion: es un error del cliente (400), no requiere conexion.
  const parsed = parseOrThrow(registerTeacherSchema, { name: args.name, email: args.email, code: args.code })

  if (!args.tx) {
    return runInTransaction((tx) => register({ name: parsed.name, email: parsed.email, code: parsed.code, tx }))
  }

  const { tx } = args
  const db = tx
  const normalizedEmail = parsed.email

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    throw new AppError("El correo electrónico ya está registrado en la plataforma", 409)
  }

  const linuxUsername = sanitizeUsername(normalizedEmail)

  const user = await db.user.create({
    data: {
      name: parsed.name,
      email: normalizedEmail,
      role: Role.teacher,
      active: true,
      teacher: {
        create: { code: parsed.code },
      },
      linuxAccount: {
        create: {
          linux_username: linuxUsername,
          linux_provisioned: false,
        },
      },
    },
    select: TEACHER_SELECT,
  })

  await db.job.create({
    data: {
      type: "user_provisioning",
      priority: PRIORITIES.TEACHER,
      user_id: user.id,
      payload: { username: linuxUsername },
    },
  })
  return serializeTeacher(user)
}

async function toggleActive(id, tx) {
  if (!tx) return runInTransaction((transaction) => toggleActive(id, transaction))

  const user = await tx.user.findUnique({
    where: { id },
    select: { id: true, teacher: { select: { user_id: true } }, active: true },
  })

  if (!user || !user.teacher) {
    throw new AppError("Docente no encontrado", 404)
  }

  const updated = await tx.user.update({
    where: { id },
    data: { active: !user.active },
    select: TEACHER_SELECT,
  })
  return serializeTeacher(updated)
}

async function findById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, teacher: { select: { user_id: true } } },
  })
  if (!user || !user.teacher) {
    throw new AppError("Docente no encontrado", 404)
  }
  return user
}

module.exports = { findAll, register, toggleActive, findById }
