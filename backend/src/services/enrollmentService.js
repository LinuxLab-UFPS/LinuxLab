const { Role } = require("@prisma/client")
const { parse } = require("csv-parse/sync")
const prisma = require("../../prisma/client")
const { createLinuxAccountWithUniqueUsername } = require("../utils/linuxUsername")
const { AppError } = require("../lib/errors")
const { runInTransaction } = require("../lib/transaction")
const { registerStudentSchema } = require("../dtos/groupDtos")
const { parseOrThrow } = require("../dtos/common")

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// const INSTITUTIONAL_DOMAIN = "@ufps.edu.co"

function validateEmail(email) {
  if (!email?.trim()) {
    throw new AppError("El correo electrónico es requerido", 400)
  }
  const normalized = email.toLowerCase().trim()
  if (!EMAIL_REGEX.test(normalized)) {
    throw new AppError(`El formato del correo electrónico no es válido: ${email}`, 400)
  }
  // if (!normalized.endsWith(INSTITUTIONAL_DOMAIN)) {
  //   throw new ServiceError(
  //     `Solo se permiten correos institucionales ${INSTITUTIONAL_DOMAIN}: ${email}`,
  //     400,
  //   )
  // }
  return normalized
}

async function ensureGroupAccess({ groupId, teacherUserId, role, tx = prisma }) {
  const group = await tx.group.findUnique({ where: { id: groupId } })
  if (!group) {
    throw new AppError("Grupo no encontrado", 404)
  }
  if (role !== "admin" && group.teacher_id !== teacherUserId) {
    throw new AppError("No tienes permiso sobre este grupo", 403)
  }
  return group
}

async function ensureStudentExists({ email, name, code, tx = prisma }) {
  const normalizedEmail = validateEmail(email)
  let user = await tx.user.findUnique({
    where: { email: normalizedEmail },
    include: { linuxAccount: true },
  })

  if (user && user.role !== Role.student) {
    throw new AppError(
      `El correo ${normalizedEmail} pertenece a un usuario con rol ${user.role}, no se puede inscribir como estudiante`,
      409,
    )
  }

  if (!user) {
    user = await tx.user.create({
      data: {
        name: name?.trim() || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: Role.student,
        code: code?.trim() || null,
        active: true,
      },
    })
    const linuxUsername = await createLinuxAccountWithUniqueUsername(tx, user.id, normalizedEmail)
    user.linuxAccount = {
      user_id: user.id,
      linux_username: linuxUsername,
      linux_provisioned: false,
    }
    return user
  }

  if (code?.trim() && !user.code) {
    await tx.user.update({
      where: { id: user.id },
      data: { code: code.trim() },
    })
    user.code = code.trim()
  }

  if (!user.linuxAccount) {
    await createLinuxAccountWithUniqueUsername(tx, user.id, normalizedEmail)
    user = await tx.user.findUnique({
      where: { id: user.id },
      include: { linuxAccount: true },
    })
  }

  return user
}

function serializeStudent(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    code: user.code ?? null,
  }
}

async function registerStudent(args) {
  // Se valida fuera de la transaccion: un email o codigo invalido es un error
  // del cliente (400) y no tiene sentido gastar una conexion en el.
  const parsed = parseOrThrow(registerStudentSchema, {
    name: args.name,
    email: args.email,
    code: args.code,
  })

  if (!args.tx) {
    return runInTransaction((tx) => registerStudent({ ...args, name: parsed.name, email: parsed.email, code: parsed.code, tx }))
  }

  const { groupId, name, email, code, teacherUserId, role, tx } = args
  const group = await ensureGroupAccess({ groupId, teacherUserId, role, tx })
  const groupDir = group.group_dir || undefined
  const groupName = groupDir ? `grp_${groupId.replace(/-/g, "").substring(0, 8)}` : undefined
  const teacherAccount = await tx.linuxAccount.findUnique({ where: { user_id: teacherUserId } })
  return enrollOne({ groupId, name, email, code, groupDir, groupName, teacherUsername: teacherAccount?.linux_username, tx })
}

async function enrollOne({ groupId, name, email, code, groupDir, groupName, teacherUsername, tx = prisma }) {
  const user = await ensureStudentExists({ email, name, code, tx })

  const existing = await tx.enrollment.findUnique({
    where: { student_id_group_id: { student_id: user.id, group_id: groupId } },
  })
  if (existing) {
    return {
      enrolled: false,
      reason: "already_enrolled",
      student: serializeStudent(user),
      linuxProvisioned: user.linuxAccount?.linux_provisioned ?? false,
    }
  }

  try {
    await tx.enrollment.create({
      data: {
        student_id: user.id,
        group_id: groupId,
      },
    })
  } catch (err) {
    if (err?.code === "P2002") {
      return {
        enrolled: false,
        reason: "already_enrolled",
        student: serializeStudent(user),
        linuxProvisioned: user.linuxAccount?.linux_provisioned ?? false,
      }
    }
    throw err
  }

  if (user.linuxAccount && !user.linuxAccount.linux_provisioned) {
    await tx.userProvisioningJob.create({
      data: {
        user_id: user.linuxAccount.user_id,
        username: user.linuxAccount.linux_username,
        group_id: groupDir ? groupId : null,
        group_dir: groupDir || null,
        group_name: groupName || null,
        teacher_username: teacherUsername || null,
        priority: 1,
      },
    })
  }

  const finalUser = await tx.user.findUnique({
    where: { id: user.id },
    include: { linuxAccount: true },
  })

  return {
    enrolled: true,
    student: serializeStudent(finalUser),
    linuxProvisioned: finalUser.linuxAccount?.linux_provisioned ?? false,
  }
}

async function listByGroup({ groupId, teacherUserId, role }) {
  await ensureGroupAccess({ groupId, teacherUserId, role })

  const enrollments = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          code: true,
          linuxAccount: { select: { linux_username: true, linux_provisioned: true } },
        },
      },
    },
    orderBy: { enrolled_at: "asc" },
  })

  return enrollments.map((e) => ({
    enrollmentId: e.id,
    id: e.student.id,
    name: e.student.name,
    email: e.student.email,
    code: e.student.code,
    status: e.status,
    linuxUsername: e.student.linuxAccount?.linux_username ?? null,
    linuxProvisioned: e.student.linuxAccount?.linux_provisioned ?? false,
    enrolledAt: e.enrolled_at,
  }))
}

/**
 * Un estudiante solo tiene acceso mientras tenga una matricula activa en un
 * grupo no archivado. Al archivar (fin de semestre) las matriculas del grupo
 * pasan a 'archived' y esto deja de cumplirse.
 */
async function hasActiveEnrollment(userId) {
  const count = await prisma.enrollment.count({
    where: {
      student_id: userId,
      status: "active",
      group: { archived: false },
    },
  })
  return count > 0
}

function parseCsvRows(csvText) {
  if (!csvText?.trim()) {
    throw new AppError("El contenido CSV está vacío", 400)
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
        error: err instanceof AppError ? err.message : err?.message || String(err),
      })
    }
  }

  return result
}

module.exports = {
  registerStudent,
  enrollOne,
  ensureStudentExists,
  importCsv,
  listByGroup,
  hasActiveEnrollment,
  serializeStudent,
}
