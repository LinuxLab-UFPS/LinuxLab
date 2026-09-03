const { Prisma, Role } = require("@prisma/client")
const { parse } = require("csv-parse/sync")
const prisma = require("../../prisma/client")
const { createLinuxAccountWithUniqueUsername, createLinuxAccountsUnique } = require("../utils/linuxUsername")
const { AppError } = require("../lib/errors")
const { runInTransaction } = require("../lib/transaction")
const { registerStudentSchema } = require("../dtos/groupDtos")
const { registerSelfStudentSchema, setStudentCodeSchema } = require("../dtos/authDtos")
const { parseOrThrow } = require("../dtos/common")
const { groupNameOf } = require("../utils/groupName")
const accessService = require("./accessService")
const attemptService = require("./attemptService")
const auditService = require("./auditService")
const config = require("../config/env")
const logger = require("../lib/logger")
const emailService = require("./emailService")
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
    include: { linuxAccount: true, student: true },
  })

  if (user && user.role === Role.teacher) {
    throw new AppError(
      `El correo ${normalizedEmail} pertenece a un docente, no se puede inscribir como estudiante`,
      409,
    )
  }

  const willCreateStudent = !user || (!user.student && user.role === Role.student)
  if (willCreateStudent && !code?.trim()) {
    throw new AppError(
      "Debes definir tu código de estudiante antes de inscribirte.",
      400,
      "STUDENT_CODE_REQUIRED",
    )
  }

  if (!user) {
    user = await tx.user.create({
      data: {
        name: name?.trim() || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: Role.student,
        active: true,
        student: {
          create: { code: code?.trim() || null },
        },
      },
      include: { student: true },
    })
    const linuxUsername = await createLinuxAccountWithUniqueUsername(tx, user.id, normalizedEmail)
    user.linuxAccount = {
      user_id: user.id,
      linux_username: linuxUsername,
      linux_provisioned: false,
    }
    return user
  }

  if (code?.trim() && user.student && !user.student.code) {
    await tx.student.update({
      where: { user_id: user.id },
      data: { code: code.trim() },
    })
    user.student.code = code.trim()
  }

  if (!user.student && user.role === Role.student) {
    await tx.student.create({
      data: { user: { connect: { id: user.id } }, code: code?.trim() || null },
    })
    user.student = { user_id: user.id, code: code?.trim() || null }
  }

  if (!user.linuxAccount) {
    await createLinuxAccountWithUniqueUsername(tx, user.id, normalizedEmail)
    user = await tx.user.findUnique({
      where: { id: user.id },
      include: { linuxAccount: true, student: true },
    })
  }

  return user
}

function serializeStudent(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    code: user.student?.code ?? null,
  }
}

async function registerSelfStudent(args) {
  const parsed = parseOrThrow(registerSelfStudentSchema, {
    name: args.name,
    email: args.email,
    code: args.code,
  })
  return runInTransaction((tx) => registerSelfStudentInner({ ...parsed, tx }))
}

async function registerSelfStudentInner({ name, email, code, tx }) {
  let user = await tx.user.findUnique({
    where: { email },
    include: { student: true, linuxAccount: true },
  })

  if (!user) {
    user = await tx.user.create({
      data: { email, name, role: "student", active: true },
      include: { student: true, linuxAccount: true },
    })
    try {
      await createLinuxAccountWithUniqueUsername(tx, user.id, email)
    } catch (e) {
      logger.error({ err: e, email }, "No se pudo crear la cuenta Linux en auto-registro")
    }
    user = await tx.user.findUnique({
      where: { id: user.id },
      include: { student: true, linuxAccount: true },
    })
  }

  if (user.role !== Role.student) {
    throw new AppError(
      "Este correo ya está registrado con una cuenta de docente o administrador.",
      409,
      "CONFLICT",
    )
  }

  if (!user.student) {
    await tx.student.create({
      data: { user: { connect: { id: user.id } }, code: code.trim() },
    })
  } else if (!user.student.code) {
    await tx.student.update({
      where: { user_id: user.id },
      data: { code: code.trim() },
    })
  }

  return user
}

async function setSelfStudentCode(args) {
  const parsed = parseOrThrow(setStudentCodeSchema, { code: args.code, name: args.name })
  return runInTransaction((tx) =>
    setSelfStudentCodeInner({
      code: parsed.code.trim(),
      name: parsed.name ?? null,
      userId: args.userId,
      tx,
    }),
  )
}

async function setSelfStudentCodeInner({ userId, code, name, tx }) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: { student: true, linuxAccount: true },
  })
  if (!user) {
    throw new AppError("Usuario no encontrado", 404, "NOT_FOUND")
  }
  if (user.role !== Role.student) {
    throw new AppError("Solo los estudiantes pueden definir su código.", 403, "FORBIDDEN")
  }

  if (name && name !== user.name) {
    await tx.user.update({ where: { id: userId }, data: { name } })
    user.name = name
  }

  if (user.student) {
    if (user.student.code) return user
    await tx.student.update({ where: { user_id: userId }, data: { code } })
    user.student.code = code
    return user
  }

  await tx.student.create({
    data: { user: { connect: { id: userId } }, code },
  })
  user.student = { user_id: userId, code, created_at: new Date(), updated_at: new Date() }
  return user
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

  // Si el correo no tenía cuenta en la plataforma, la matrícula la pre-crea;
  // hay que avisarle con el proceso de registro para que pueda entrar.
  const wasNewUser = !(await tx.user.findUnique({ where: { email } }))

  const outcome = await enrollOne({ groupId, name, email, code, groupDir, groupName, teacherUsername: teacherAccount?.linux_username, tx })

  if (outcome.enrolled && wasNewUser) {
    try {
      const loginUrl = `${config.frontendUrl}/login`
      const { subject, html, text } = emailService.renderStudentEnrollmentEmail(group.name, loginUrl)
      await emailService.sendMail({ to: email, subject, html, text, category: "student_enrollment" })
      logger.info({ email, groupId }, "email de inscripción enviado")
    } catch (mailErr) {
      logger.error({ err: mailErr, email, groupId }, "Fallo envío email de inscripción (no bloqueante)")
    }
  }

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

  // Un estudiante cursa un solo grupo a la vez. El lock de la fila del
  // estudiante serializa dos matriculas concurrentes, igual que los intentos
  // serializan con la fila de la matricula.
  await tx.$queryRaw`SELECT user_id FROM "Student" WHERE user_id = ${user.id} FOR UPDATE`
  const activeElsewhere = await tx.enrollment.findFirst({
    where: {
      student_id: user.id,
      status: "active",
      group: { status: "active" },
      group_id: { not: groupId },
    },
    select: { group: { select: { name: true } } },
  })
  if (activeElsewhere) {
    throw new AppError(
      `El estudiante ya pertenece al grupo activo '${activeElsewhere.group.name}'`,
      409,
      "CONFLICT",
    )
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
    await tx.job.create({
      data: {
        type: "user_provisioning",
        priority: PRIORITIES.STUDENT,
        user_id: user.linuxAccount.user_id,
        group_id: groupDir ? groupId : null,
        payload: {
          username: user.linuxAccount.linux_username,
          group_dir: groupDir || null,
          group_name: groupName || null,
          teacher_username: teacherUsername || null,
        },
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
    include: { linuxAccount: true, student: true },
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
      if (r.code && existing.student && !existing.student.code) {
        await db.student.update({ where: { user_id: existing.id }, data: { code: r.code } })
      }
      if (!existing.student && existing.role === Role.student) {
        await db.student.create({ data: { user: { connect: { id: existing.id } }, code: r.code || null } })
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
  const codeByEmail = new Map(toCreate.map((s) => [s.email, s.code || null]))

  if (toCreate.length > 0) {
    await db.user.createMany({
      data: toCreate.map((s) => ({
        name: s.name || s.email.split("@")[0],
        email: s.email,
        role: Role.student,
        active: true,
      })),
      skipDuplicates: true,
    })

    const createdForStudent = await db.user.findMany({
      where: { email: { in: toCreate.map((s) => s.email) } },
      select: { id: true, email: true },
    })
    await db.student.createMany({
      data: createdForStudent.map((u) => ({
        user_id: u.id,
        code: codeByEmail.get(u.email) || null,
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
  const candidates = toEnroll.filter((e) => !enrolledIds.has(e.userId))
  result.skipped += toEnroll.length - candidates.length

  // Un estudiante cursa un solo grupo a la vez: los que ya estan matriculados
  // en otro grupo activo se apartan y se reportan como error de fila. El lock
  // de las filas de estudiante serializa dos lotes concurrentes.
  const newEnrollments = []
  if (candidates.length > 0) {
    await db.$queryRaw`SELECT user_id FROM "Student" WHERE user_id IN (${Prisma.join(
      candidates.map((e) => e.userId),
    )}) FOR UPDATE`
    const busy = await db.enrollment.findMany({
      where: {
        student_id: { in: candidates.map((e) => e.userId) },
        status: "active",
        group: { status: "active" },
        group_id: { not: groupId },
      },
      select: { student_id: true, group: { select: { name: true } } },
    })
    const busyByUser = new Map(busy.map((b) => [b.student_id, b.group.name]))
    for (const e of candidates) {
      const busyGroup = busyByUser.get(e.userId)
      if (busyGroup) {
        result.errors.push({
          row: e.row,
          email: e.email,
          error: `Ya pertenece al grupo activo '${busyGroup}'; no se puede matricular en otro`,
        })
        continue
      }
      newEnrollments.push(e)
    }
  }

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
      type: "user_provisioning",
      priority: PRIORITIES.STUDENT,
      user_id: e.userId,
      group_id: groupDir ? groupId : null,
      payload: {
        username: u.linuxUsername,
        group_dir: groupDir || null,
        group_name: groupName || null,
        teacher_username: teacherUsername || null,
      },
    })
  }
  if (jobRows.length > 0) {
    await db.job.createMany({ data: jobRows })
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
          code: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              last_login: true,
              linuxAccount: { select: { linux_username: true, linux_provisioned: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: "asc" },
  })

  // Lo que propone el grupo son las suyas mas las del temario, que trae todo
  // grupo. Contar solo las del docente daba un "N de M" donde M se quedaba en 0
  // en un curso recien creado.
  const [delDocente, delTemario, completadasTemario] = await Promise.all([
    prisma.groupActivity.count({ where: { group_id: groupId } }),
    attemptService.topicActivitiesTotal(),
    attemptService.passedTopicCountByEnrollment(enrollments.map((e) => e.id)),
  ])
  const totalActivities = delDocente + delTemario

  const completedRows = await prisma.$queryRaw`
    SELECT e.student_id, COUNT(DISTINCT gs.group_activity_id)::int AS completed
    FROM "GroupSubmission" gs
    JOIN "Enrollment" e ON e.id = gs.enrollment_id
    JOIN "GroupActivity" ga ON ga.id = gs.group_activity_id
    WHERE ga.group_id = ${groupId}
    GROUP BY e.student_id
  `
  const completedMap = new Map(completedRows.map((r) => [r.student_id, r.completed]))

  return enrollments.map((e) => ({
    enrollmentId: e.id,
    id: e.student.user.id,
    name: e.student.user.name,
    email: e.student.user.email,
    code: e.student.code,
    status: e.status,
    linuxUsername: e.student.user.linuxAccount?.linux_username ?? null,
    linuxProvisioned: e.student.user.linuxAccount?.linux_provisioned ?? false,
    enrolledAt: e.created_at,
    lastLogin: e.student.user.last_login?.toISOString() ?? null,
    completedActivities:
      (completedMap.get(e.student.user_id) ?? 0) + (completadasTemario.get(e.id) ?? 0),
    totalActivities,
    // Aparte del total, porque la columna del cuaderno cuenta solo estas.
    topicActivitiesDone: completadasTemario.get(e.id) ?? 0,
    topicActivitiesTotal: delTemario,
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
      group: { status: "active" },
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
      group: { status: "active" },
    },
    select: { group_id: true },
    orderBy: { created_at: "asc" },
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

/**
 * Información pública de un grupo para la pantalla de inscripción vía enlace.
 * Valida el token; si quien consulta tiene sesión de estudiante, se incluye
 * `enrolled` para que el frontend muestre el estado "ya inscrito".
 */
async function getGroupInfo({ groupId, token, req }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { teacher: { select: { user: { select: { name: true } } } } },
  })
  if (!group || group.status !== "active") {
    throw new AppError("El grupo no existe o ya no está activo", 404, "NOT_FOUND")
  }
  if (!group.invite_token || group.invite_token !== token) {
    throw new AppError("El enlace de inscripción no es válido", 403, "FORBIDDEN")
  }

  let enrolled = null
  if (req.user?.id && req.user.role === Role.student) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_group_id: { student_id: req.user.id, group_id: groupId } },
      select: { id: true },
    })
    enrolled = Boolean(enrollment)
  }

  return {
    name: group.name,
    description: group.description ?? "",
    teacherName: group.teacher?.user?.name ?? null,
    enrolled,
  }
}

/**
 * Auto-inscripción mediante el enlace compartido por el docente. Solo pueden
 * usarlo usuarios con rol estudiante; el docente/admin recibe 403. Reutiliza
 * `enrollOne`, de modo que se crea la cuenta Linux y el aprovisionamiento si
 * hace falta, y la matrícula es idempotente.
 */
async function joinWithToken({ groupId, token, user, req }) {
  return runInTransaction(async (tx) => {
    const group = await tx.group.findUnique({ where: { id: groupId } })
    if (!group || group.status !== "active") {
      throw new AppError("El grupo no existe o ya no está activo", 404, "NOT_FOUND")
    }
    if (!group.invite_token || group.invite_token !== token) {
      throw new AppError("El enlace de inscripción no es válido", 403, "FORBIDDEN")
    }
    if (user.role !== Role.student) {
      throw new AppError("Solo los estudiantes pueden inscribirse con este enlace", 403, "FORBIDDEN")
    }

    const teacherAccount = await tx.linuxAccount.findUnique({
      where: { user_id: group.teacher_id },
    })

    const outcome = await enrollOne({
      groupId,
      email: user.email,
      name: user.name,
      code: null,
      groupDir: group.group_dir || undefined,
      groupName: groupNameOf(groupId),
      teacherUsername: teacherAccount?.linux_username,
      tx,
    })

    if (outcome.enrolled) {
      const { ip, userAgent, actorRole } = auditService.requestMeta(req)
      auditService.audit({
        userId: user.id,
        groupId,
        eventType: "student_joined",
        target: user.email,
        metadata: { groupId, groupName: group.name },
        actorRole: actorRole ?? user.role,
        ip,
        userAgent,
      })
    }

    return { ...outcome, groupName: group.name }
  })
}

module.exports = {
  registerStudent,
  enrollOne,
  enrollMany,
  ensureStudentExists,
  getGroupInfo,
  joinWithToken,
  importCsv,
  listByGroup,
  hasActiveEnrollment,
  getActiveGroupId,
  serializeStudent,
  registerSelfStudent,
  setSelfStudentCode,
}
