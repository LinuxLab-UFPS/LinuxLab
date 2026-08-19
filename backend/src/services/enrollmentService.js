const { Role } = require("@prisma/client")
const { parse } = require("csv-parse/sync")
const prisma = require("../../prisma/client")
const { createLinuxAccountWithUniqueUsername, createLinuxAccountsUnique } = require("../utils/linuxUsername")
const { AppError } = require("../lib/errors")
const { runInTransaction } = require("../lib/transaction")
const { registerStudentSchema } = require("../dtos/groupDtos")
const { parseOrThrow } = require("../dtos/common")
const { groupNameOf } = require("../utils/groupName")
const accessService = require("./accessService")
const auditService = require("./auditService")
const { EMAIL_REGEX, PRIORITIES } = require("../lib/constants")

function validateEmail(email) {
  if (!email?.trim()) {
    throw new AppError("El correo electrónico es requerido", 400)
  }
  const normalized = email.toLowerCase().trim()
  if (!EMAIL_REGEX.test(normalized)) {
    throw new AppError(`El formato del correo electrónico no es válido: ${email}`, 400)
  }
  return normalized
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
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role, tx })
  const groupDir = group.group_dir || undefined
  const groupName = groupDir ? groupNameOf(groupId) : undefined
  const teacherAccount = await tx.linuxAccount.findUnique({ where: { user_id: teacherUserId } })
  const outcome = await enrollOne({ groupId, name, email, code, groupDir, groupName, teacherUsername: teacherAccount?.linux_username, tx })

  if (outcome.enrolled) {
    auditService.audit({
      userId: teacherUserId,
      groupId,
      eventType: "student_registered",
      target: outcome.student.email,
      metadata: {
        studentId: outcome.student.id,
        studentName: outcome.student.name,
      },
    })
  }

  return outcome
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
        priority: PRIORITIES.STUDENT,
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

/**
 * Matricula un lote de estudiantes en un grupo (creacion de curso con
 * estudiantes). Todo se resuelve con consultas por lote: un puñado sin
 * importar cuantos estudiantes sean. El loop fila por fila expiraba la
 * transaccion interactiva de 30s con cohortes grandes (P2028). El contrato
 * de respuesta no cambia: los errores de una fila no tumban el lote.
 */
async function enrollMany({ groupId, students, groupDir, groupName, teacherUsername, tx = prisma }) {
  const db = tx
  const result = {
    total: students.length,
    registered: 0,
    skipped: 0,
    errors: [],
  }

  // Prevalidacion en memoria: formato de correo y duplicados del payload.
  const seenEmails = new Set()
  const rows = []
  for (let i = 0; i < students.length; i++) {
    const row = students[i] ?? {}
    const email = row.email?.trim().toLowerCase()
    if (!email || !EMAIL_REGEX.test(email)) {
      result.errors.push({
        row: i + 1,
        email: email || null,
        error: "El formato del correo electrónico no es válido",
      })
      continue
    }
    if (seenEmails.has(email)) {
      result.skipped += 1
      continue
    }
    seenEmails.add(email)
    rows.push({ row: i + 1, email, name: row.name?.trim(), code: row.code?.trim() || null })
  }
  if (rows.length === 0) return result

  const emails = rows.map((r) => r.email)

  // Usuarios existentes, de una vez. Los que ya pertenecen a otro rol son
  // error de fila; los demas se usan tal cual.
  const existingUsers = await db.user.findMany({
    where: { email: { in: emails } },
    include: { linuxAccount: true },
  })
  const byEmail = new Map(existingUsers.map((u) => [u.email, u]))

  const usersById = new Map()
  const toEnroll = []
  const toCreate = []

  for (const r of rows) {
    const existing = byEmail.get(r.email)
    if (existing && existing.role !== Role.student) {
      result.errors.push({
        row: r.row,
        email: r.email,
        error: `El correo ${r.email} pertenece a un usuario con rol ${existing.role}, no se puede inscribir como estudiante`,
      })
      continue
    }
    if (existing) {
      // Un codigo que faltaba se rellena, como hacia el flujo fila por fila.
      if (r.code && !existing.code) {
        await db.user.update({ where: { id: existing.id }, data: { code: r.code } })
      }
      usersById.set(existing.id, {
        email: existing.email,
        linuxUsername: existing.linuxAccount?.linux_username ?? null,
        linuxProvisioned: existing.linuxAccount?.linux_provisioned ?? false,
      })
      toEnroll.push({ row: r.row, email: r.email, userId: existing.id })
    } else {
      toCreate.push(r)
    }
  }

  // Usuarios nuevos, en lote. skipDuplicates absorbe la carrera de dos
  // requests creando el mismo correo; los que queden sin fila (el otro
  // request los creo entre el createMany y el findMany) se releen de a uno.
  if (toCreate.length > 0) {
    await db.user.createMany({
      data: toCreate.map((s) => ({
        name: s.name || s.email.split("@")[0],
        email: s.email,
        role: Role.student,
        code: s.code,
        active: true,
      })),
      skipDuplicates: true,
    })

    const created = await db.user.findMany({
      where: { email: { in: toCreate.map((s) => s.email) } },
      include: { linuxAccount: true },
    })
    const createdByEmail = new Map(created.map((u) => [u.email, u]))

    for (const s of toCreate) {
      let user = createdByEmail.get(s.email)
      if (!user) {
        user = await db.user.findUnique({
          where: { email: s.email },
          include: { linuxAccount: true },
        })
      }
      if (!user || user.role !== Role.student) {
        result.errors.push({
          row: s.row,
          email: s.email,
          error: user
            ? `El correo ${s.email} pertenece a un usuario con rol ${user.role}, no se puede inscribir como estudiante`
            : "No se pudo crear la cuenta del estudiante",
        })
        continue
      }
      usersById.set(user.id, {
        email: user.email,
        linuxUsername: user.linuxAccount?.linux_username ?? null,
        linuxProvisioned: user.linuxAccount?.linux_provisioned ?? false,
      })
      toEnroll.push({ row: s.row, email: s.email, userId: user.id })
    }
  }

  // Cuentas Linux de los que no tienen, tambien en lote. Devuelve las filas
  // creadas para conocer el username que quedo asignado a cada usuario.
  const withoutAccount = [...usersById.entries()].filter(([, u]) => !u.linuxUsername)
  if (withoutAccount.length > 0) {
    const createdAccounts = await createLinuxAccountsUnique(
      db,
      withoutAccount.map(([id, u]) => ({ id, email: u.email })),
    )
    for (const account of createdAccounts) {
      const current = usersById.get(account.user_id)
      usersById.set(account.user_id, {
        email: current.email,
        linuxUsername: account.linux_username,
        linuxProvisioned: false,
      })
    }
  }

  // Matriculas ya existentes: no se duplican, cuentan como omitidas.
  const userIds = [...usersById.keys()]
  const existingEnrollments = await db.enrollment.findMany({
    where: { group_id: groupId, student_id: { in: userIds } },
    select: { student_id: true },
  })
  const enrolledIds = new Set(existingEnrollments.map((e) => e.student_id))
  const newEnrollments = toEnroll.filter((e) => !enrolledIds.has(e.userId))
  result.skipped += toEnroll.length - newEnrollments.length

  if (newEnrollments.length > 0) {
    await db.enrollment.createMany({
      data: newEnrollments.map((e) => ({ student_id: e.userId, group_id: groupId })),
      skipDuplicates: true,
    })
  }

  // Jobs de aprovisionamiento para las cuentas que faltan en el entorno.
  const jobRows = []
  for (const e of newEnrollments) {
    const u = usersById.get(e.userId)
    if (!u?.linuxUsername || u.linuxProvisioned) continue
    jobRows.push({
      user_id: e.userId,
      username: u.linuxUsername,
      group_id: groupDir ? groupId : null,
      group_dir: groupDir || null,
      group_name: groupName || null,
      teacher_username: teacherUsername || null,
      priority: PRIORITIES.STUDENT,
    })
  }
  if (jobRows.length > 0) {
    await db.userProvisioningJob.createMany({ data: jobRows })
  }

  result.registered = newEnrollments.length
  return result
}

async function listByGroup({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const enrollments = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          code: true,
          last_login: true,
          linuxAccount: { select: { linux_username: true, linux_provisioned: true } },
        },
      },
    },
    orderBy: { enrolled_at: "asc" },
  })

  const totalActivities = await prisma.groupActivity.count({ where: { group_id: groupId } })

  const completedRows = await prisma.$queryRaw`
    SELECT student_id, COUNT(DISTINCT group_activity_id)::int AS completed
    FROM activity_attempts a
    JOIN group_activities ga ON ga.id = a.group_activity_id
    WHERE ga.group_id = ${groupId}
    GROUP BY student_id
  `
  const completedMap = new Map(completedRows.map((r) => [r.student_id, r.completed]))

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
    lastLogin: e.student.last_login?.toISOString() ?? null,
    completedActivities: completedMap.get(e.student.id) ?? 0,
    totalActivities,
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

/** Grupo activo del estudiante, o null si no tiene matricula activa vigente. */
async function getActiveGroupId(userId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      student_id: userId,
      status: "active",
      group: { archived: false },
    },
    select: { group_id: true },
    orderBy: { enrolled_at: "asc" },
  })
  return enrollment?.group_id ?? null
}

function parseCsvRows(csvText) {
  if (!csvText?.trim()) {
    throw new AppError("El contenido CSV está vacío", 400)
  }
  const rows = parse(csvText, {
    columns: ["nombre", "email", "codigo"],
    from: 1,
    skip_empty_lines: true,
    trim: true,
  })
  // El frontend exige el encabezado nombre,email,codigo: se valida aqui (un
  // archivo sin el encabezado se rechazaria en silencio y perderia su primera
  // fila) y la fila del encabezado no cuenta como estudiante.
  const header = rows[0] ?? {}
  if (String(header.email ?? "").trim().toLowerCase() !== "email") {
    throw new AppError("El archivo debe tener el encabezado nombre,email,codigo", 400)
  }
  return rows.slice(1)
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

  if (result.registered > 0) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true },
    })
    auditService.audit({
      userId: teacherUserId,
      groupId,
      eventType: "csv_imported",
      target: group?.name ?? null,
      metadata: {
        total: result.total,
        registered: result.registered,
        skipped: result.skipped,
        errors: result.errors.length,
      },
    })
  }

  return result
}

module.exports = {
  registerStudent,
  enrollOne,
  enrollMany,
  ensureStudentExists,
  importCsv,
  listByGroup,
  hasActiveEnrollment,
  getActiveGroupId,
  serializeStudent,
}
