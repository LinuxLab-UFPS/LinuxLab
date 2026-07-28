const { Role } = require("@prisma/client")
const { parse } = require("csv-parse/sync")
const prisma = require("../../prisma/client")
const { sanitizeUsername } = require("../utils/sanitizeUsername")
const linuxContainerService = require("./linuxContainerService")

class ServiceError extends Error {
  constructor(message, status) {
    super(message)
    this.name = "ServiceError"
    this.status = status
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INSTITUTIONAL_DOMAIN = "@ufps.edu.co"

function validateEmail(email) {
  if (!email?.trim()) {
    throw new ServiceError("El correo electrónico es requerido", 400)
  }
  const normalized = email.toLowerCase().trim()
  if (!EMAIL_REGEX.test(normalized)) {
    throw new ServiceError(`El formato del correo electrónico no es válido: ${email}`, 400)
  }
  if (!normalized.endsWith(INSTITUTIONAL_DOMAIN)) {
    throw new ServiceError(
      `Solo se permiten correos institucionales ${INSTITUTIONAL_DOMAIN}: ${email}`,
      400,
    )
  }
  return normalized
}

async function ensureGroupAccess({ groupId, teacherUserId, role }) {
  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group) {
    throw new ServiceError("Grupo no encontrado", 404)
  }
  if (role !== "admin" && group.teacher_id !== teacherUserId) {
    throw new ServiceError("No tienes permiso sobre este grupo", 403)
  }
  return group
}

async function ensureStudentExists({ email, name, code }) {
  const normalizedEmail = validateEmail(email)
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { student: true, linuxAccount: true },
  })

  if (user && user.role !== Role.student) {
    throw new ServiceError(
      `El correo ${normalizedEmail} pertenece a un usuario con rol ${user.role}, no se puede inscribir como estudiante`,
      409,
    )
  }

  if (!user) {
    const linuxUsername = sanitizeUsername(normalizedEmail)
    user = await prisma.user.create({
      data: {
        name: name?.trim() || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: Role.student,
        active: true,
        student: { create: { code: code?.trim() || null } },
        linuxAccount: {
          create: {
            linux_username: linuxUsername,
            linux_provisioned: false,
          },
        },
      },
      include: { student: true, linuxAccount: true },
    })
    return user
  }

  if (!user.student) {
    await prisma.student.create({
      data: { user_id: user.id, code: code?.trim() || null },
    })
  } else if (code?.trim() && !user.student.code) {
    await prisma.student.update({
      where: { user_id: user.id },
      data: { code: code.trim() },
    })
  }

  if (!user.linuxAccount) {
    const linuxUsername = sanitizeUsername(normalizedEmail)
    await prisma.linuxAccount.create({
      data: {
        user_id: user.id,
        linux_username: linuxUsername,
        linux_provisioned: false,
      },
    })
    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: { student: true, linuxAccount: true },
    })
  }

  return user
}

async function provisionLinuxAccount(linuxAccountId, username) {
  let provisioningError = null
  try {
    const exists = await linuxContainerService.userExists(username)
    if (!exists) {
      await linuxContainerService.createUser(username)
    }
    await prisma.linuxAccount.update({
      where: { user_id: linuxAccountId },
      data: { linux_provisioned: true },
    })
  } catch (err) {
    provisioningError = err?.message || String(err)
    console.error("Linux provisioning failed for", username, ":", provisioningError)
  }
  return provisioningError
}

function serializeStudent(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    code: user.student?.code ?? null,
  }
}

async function registerStudent({ groupId, name, email, code, teacherUserId, role }) {
  await ensureGroupAccess({ groupId, teacherUserId, role })
  return enrollOne({ groupId, name, email, code })
}

async function enrollOne({ groupId, name, email, code }) {
  const user = await ensureStudentExists({ email, name, code })

  const existing = await prisma.enrollment.findUnique({
    where: { student_id_group_id: { student_id: user.student.user_id, group_id: groupId } },
  })
  if (existing) {
    return {
      enrolled: false,
      reason: "already_enrolled",
      student: serializeStudent(user),
      linuxProvisioned: user.linuxAccount?.linux_provisioned ?? false,
    }
  }

  let provisioningError = null
  if (user.linuxAccount && !user.linuxAccount.linux_provisioned) {
    provisioningError = await provisionLinuxAccount(
      user.linuxAccount.user_id,
      user.linuxAccount.linux_username,
    )
  }

  await prisma.enrollment.create({
    data: {
      student_id: user.student.user_id,
      group_id: groupId,
    },
  })

  const finalUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { student: true, linuxAccount: true },
  })

  return {
    enrolled: true,
    student: serializeStudent(finalUser),
    linuxProvisioned: finalUser.linuxAccount?.linux_provisioned ?? false,
    provisioningError,
  }
}

async function listByGroup({ groupId, teacherUserId, role }) {
  await ensureGroupAccess({ groupId, teacherUserId, role })

  const enrollments = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    include: {
      student: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { enrolled_at: "asc" },
  })

  return enrollments.map((e) => ({
    enrollmentId: e.id,
    id: e.student.user.id,
    name: e.student.user.name,
    email: e.student.user.email,
    code: e.student.code,
    enrolledAt: e.enrolled_at,
  }))
}

function parseCsvRows(csvText) {
  if (!csvText?.trim()) {
    throw new ServiceError("El contenido CSV está vacío", 400)
  }
  return parse(csvText, {
    columns: ["nombre", "email", "codigo"],
    skip_empty_lines: true,
    trim: true,
  })
}

async function importCsv({ groupId, csvText, teacherUserId, role }) {
  const rows = parseCsvRows(csvText)
  const result = {
    total: rows.length,
    registered: 0,
    skipped: 0,
    errors: [],
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    try {
      const outcome = await registerStudent({
        groupId,
        name: row.nombre,
        email: row.email,
        code: row.codigo,
        teacherUserId,
        role,
      })
      if (outcome.enrolled) {
        result.registered += 1
      } else {
        result.skipped += 1
      }
    } catch (err) {
      result.errors.push({
        row: rowNum,
        email: row.email ?? null,
        error: err instanceof ServiceError ? err.message : err?.message || String(err),
      })
    }
  }

  return result
}

module.exports = {
  registerStudent,
  enrollOne,
  ensureStudentExists,
  provisionLinuxAccount,
  importCsv,
  listByGroup,
  serializeStudent,
  ServiceError,
}
