const { randomUUID } = require("crypto")
const { Role } = require("@prisma/client")
const prisma = require("../../prisma/client")
const enrollmentService = require("./enrollmentService")
const provisioningWorker = require("./provisioningWorker")
const linuxContainerService = require("./linuxContainerService")
const logger = require("../lib/logger")
const { AppError, ConflictError } = require("../lib/errors")
const { runInTransaction } = require("../lib/transaction")
const { createLinuxAccountsUnique } = require("../utils/linuxUsername")

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateGroupDir(name, groupId) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9_\u00f1]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 20)
  const shortId = groupId.replace(/-/g, "").substring(0, 8)
  return `grp_${slug}_${shortId}`
}

function serializeGroup(group, studentCount, activityCount) {
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? "",
    archived: group.archived,
    createdAt: group.created_at,
    teacherId: group.teacher_id,
    teacherName: group.teacher?.name ?? null,
    studentCount: studentCount ?? 0,
    enabledTopics: [],
    activityCount: activityCount ?? 0,
  }
}

async function ensureTeacherRole(userId, tx = prisma) {
  const teacher = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })
  if (!teacher || teacher.role !== "teacher") {
    throw new AppError("El usuario autenticado no tiene perfil de docente", 403, "FORBIDDEN")
  }
  return teacher
}

async function getGroupAccess({ groupId, teacherUserId, role, tx = prisma }) {
  const group = await tx.group.findUnique({ where: { id: groupId } })
  if (!group) {
    throw new AppError("Grupo no encontrado", 404, "NOT_FOUND")
  }
  if (role !== "admin" && group.teacher_id !== teacherUserId) {
    throw new AppError("No tienes permiso sobre este grupo", 403, "FORBIDDEN")
  }
  return group
}

async function createGroup(args) {
  if (!args.tx) {
    return runInTransaction((tx) => createGroup({ ...args, tx }))
  }

  const { name, description, students, teacherUserId, tx } = args
  const db = tx
  if (!name?.trim()) {
    throw new AppError("El nombre del grupo es requerido", 400, "VALIDATION_ERROR")
  }
  await ensureTeacherRole(teacherUserId, db)

  const groupId = randomUUID()
  const groupDir = generateGroupDir(name, groupId)
  const groupName = `grp_${groupId.replace(/-/g, "").substring(0, 8)}`
  const group = await db.group.create({
    data: {
      id: groupId,
      name: name.trim(),
      description: description?.trim() || null,
      teacher_id: teacherUserId,
      group_dir: groupDir,
    },
  })

  const teacherAccount = await db.linuxAccount.findUnique({
    where: { user_id: teacherUserId },
  })

  if (teacherAccount?.linux_provisioned) {
    await db.groupProvisioningJob.create({
      data: {
        group_id: group.id,
        group_dir: groupDir,
        group_name: groupName,
        teacher_username: teacherAccount.linux_username,
      },
    })
  } else {
    logger.warn({ teacherUserId }, "Teacher not provisioned yet, group dir will be created after teacher provisioning")
  }

  const enrollment = await enrollStudentsInGroup({
    groupId: group.id,
    students: Array.isArray(students) ? students : [],
    groupDir,
    groupName,
    teacherUsername: teacherAccount?.linux_username,
    tx: db,
  })

  const withCount = await db.group.findUnique({
    where: { id: group.id },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { enrollments: true, groupActivities: true } },
    },
  })
  return {
    group: serializeGroup(withCount, withCount._count.enrollments, withCount._count.groupActivities),
    enrollment,
  }
}

async function enrollStudentsInGroup({ groupId, students, groupDir, groupName, teacherUsername, tx }) {
  const db = tx ?? prisma
  const result = {
    total: students.length,
    registered: 0,
    skipped: 0,
    errors: [],
  }
  const validRows = []
  const seenEmails = new Set()
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
    validRows.push({ ...row, email, rowNumber: i + 1 })
  }

  const emails = validRows.map((row) => row.email)
  if (emails.length === 0) return result

  const users = await db.user.findMany({
    where: { email: { in: emails } },
    include: { linuxAccount: true },
  })
  const usersByEmail = new Map(users.map((user) => [user.email, user]))

  for (const row of validRows) {
    const user = usersByEmail.get(row.email)
    if (user && user.role !== "student") {
      result.errors.push({
        row: row.rowNumber,
        email: row.email,
        error: `El correo ${row.email} pertenece a un usuario con rol ${user.role}, no se puede inscribir como estudiante`,
      })
    }
  }

  const acceptedRows = validRows.filter((row) => {
    const user = usersByEmail.get(row.email)
    return !user || user.role === "student"
  })
  const newRows = acceptedRows.filter((row) => !usersByEmail.has(row.email))

  if (newRows.length > 0) {
    await db.user.createMany({
      data: newRows.map((row) => ({
        name: row.name?.trim() || row.email.split("@")[0],
        email: row.email,
        role: Role.student,
        code: row.code?.trim() || null,
        active: true,
      })),
    })
  }

  const acceptedEmails = acceptedRows.map((row) => row.email)
  const acceptedUsers = await db.user.findMany({
    where: { email: { in: acceptedEmails } },
    include: { linuxAccount: true },
  })
  const acceptedUsersByEmail = new Map(acceptedUsers.map((user) => [user.email, user]))

  const codeUpdates = acceptedRows
    .map((row) => ({ row, user: acceptedUsersByEmail.get(row.email) }))
    .filter(({ row, user }) => row.code?.trim() && user && !user.code)
  for (const { row, user } of codeUpdates) {
    await db.user.update({ where: { id: user.id }, data: { code: row.code.trim() } })
    user.code = row.code.trim()
  }

  const missingLinuxAccounts = acceptedUsers.filter((user) => !user.linuxAccount)
  if (missingLinuxAccounts.length > 0) {
    try {
      await createLinuxAccountsUnique(db, missingLinuxAccounts)
    } catch (err) {
      result.errors.push({
        row: null,
        email: null,
        error: `No se pudieron crear las cuentas Linux: ${err?.message || String(err)}`,
      })
    }
  }

  const currentEnrollments = await db.enrollment.findMany({
    where: { group_id: groupId, student_id: { in: acceptedUsers.map((user) => user.id) } },
    select: { student_id: true },
  })
  const enrolledIds = new Set(currentEnrollments.map((enrollment) => enrollment.student_id))
  const newEnrollments = acceptedUsers.filter((user) => !enrolledIds.has(user.id))

  if (newEnrollments.length > 0) {
    await db.enrollment.createMany({
      data: newEnrollments.map((user) => ({ student_id: user.id, group_id: groupId })),
      skipDuplicates: true,
    })

    const linuxAccounts = await db.linuxAccount.findMany({
      where: { user_id: { in: newEnrollments.map((user) => user.id) } },
    })
    const accountByUserId = new Map(linuxAccounts.map((account) => [account.user_id, account]))
    const jobs = newEnrollments
      .map((user) => ({ user, account: accountByUserId.get(user.id) }))
      .filter(({ account }) => account && !account.linux_provisioned)
      .map(({ user, account }) => ({
        user_id: user.id,
        username: account.linux_username,
        group_id: groupDir ? groupId : null,
        group_dir: groupDir || null,
        group_name: groupName || null,
        teacher_username: teacherUsername || null,
      }))
    if (jobs.length > 0) await db.userProvisioningJob.createMany({ data: jobs })
  }

  result.registered = newEnrollments.length
  result.skipped += acceptedUsers.length - newEnrollments.length
  return result
}

async function listGroups({ teacherUserId, role }) {
  if (role === "admin") {
    const groups = await prisma.group.findMany({
      include: {
        teacher: { select: { name: true } },
        _count: { select: { enrollments: true, groupActivities: true } },
      },
      orderBy: { created_at: "desc" },
    })
    return groups.map((g) => serializeGroup(g, g._count.enrollments, g._count.groupActivities))
  }
  const groups = await prisma.group.findMany({
    where: { teacher_id: teacherUserId },
    include: { _count: { select: { enrollments: true, groupActivities: true } } },
    orderBy: { created_at: "desc" },
  })
  return groups.map((g) => serializeGroup(g, g._count.enrollments, g._count.groupActivities))
}

async function getGroup({ groupId, teacherUserId, role }) {
  const group = await getGroupAccess({ groupId, teacherUserId, role })
  const withCount = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { enrollments: true, groupActivities: true } },
    },
  })
  return serializeGroup(withCount, withCount._count.enrollments, withCount._count.groupActivities)
}

/**
 * Archiva un grupo (fin de semestre) y deja de ser usable al instante:
 * - El grupo queda desactivado y sus matriculas pasan a 'archived' (historico).
 * - Las cuentas Linux de los estudiantes se borran de la base: su usuario en
 *   el entorno ya no debe existir.
 * - Se encola un teardown job: el worker borra del contenedor los usuarios de
 *   los matriculados (los usernames se conservan en el job porque las filas se
 *   acaban de borrar) y la carpeta del grupo, eliminada por su group_dir.
 *
 * Al re-matricularse el proximo semestre se le crea una cuenta nueva y un job
 * de aprovisionamiento, por lo que nada de lo borrado aqui hace falta.
 */
async function archiveGroup(args) {
  if (!args.tx) return runInTransaction((tx) => archiveGroup({ ...args, tx }))

  const { groupId, role, teacherUserId, tx } = args
  const group = await getGroupAccess({ groupId, teacherUserId, role, tx })
  if (group.archived) {
    throw new AppError("El grupo ya está archivado", 409, "CONFLICT")
  }

  const [enrollments, teacherAccount] = await Promise.all([
    tx.enrollment.findMany({
      where: { group_id: groupId },
      include: { student: { include: { linuxAccount: true } } },
    }),
    tx.linuxAccount.findUnique({ where: { user_id: teacherUserId } }),
  ])
  const studentIds = enrollments.map((e) => e.student_id)
  const usernames = enrollments
    .map((e) => e.student.linuxAccount?.linux_username)
    .filter(Boolean)

  const updated = await tx.group.update({
    where: { id: groupId },
    data: { archived: true },
  })

  await tx.enrollment.updateMany({
    where: { group_id: groupId },
    data: { status: "archived" },
  })

  if (studentIds.length > 0) {
    await tx.linuxAccount.deleteMany({ where: { user_id: { in: studentIds } } })
  }

  // Sin esto, un job de aprovisionamiento pendiente re-crearia en el entorno
  // los usuarios que el teardown esta por eliminar.
  await tx.userProvisioningJob.deleteMany({ where: { group_id: groupId } })
  await tx.groupProvisioningJob.deleteMany({ where: { group_id: groupId } })

  if (teacherAccount?.linux_username && group.group_dir) {
    await tx.groupTeardownJob.create({
      data: {
        group_id: groupId,
        group_dir: group.group_dir,
        group_name: `grp_${groupId.replace(/-/g, "").substring(0, 8)}`,
        teacher_username: teacherAccount.linux_username,
        usernames: JSON.stringify(usernames),
      },
    })
  } else {
    logger.warn({ groupId }, "Teacher not provisioned, teardown job skipped")
  }

  return serializeGroup(updated, 0)
}

/**
 * Borra un grupo desactivado y todo lo que cuelga de el.
 *
 * Solo se permite sobre grupos ya archivados: eliminar es irreversible y esto
 * evita que un curso vivo se borre de un click. Primero se desmonta el entorno
 * Linux (usuarios, grupo y directorio) y despues se borran las filas, porque si
 * el registro desapareciera antes quedariamos sin los datos necesarios para
 * encontrar lo que hay que limpiar en el contenedor.
 *
 * Ninguna relacion del schema declara onDelete: Cascade, asi que las
 * dependientes se borran a mano y en orden dentro de una transaccion.
 */
async function deleteGroup({ groupId, role, teacherUserId }) {
  const group = await getGroupAccess({ groupId, teacherUserId, role })
  if (!group.archived) {
    throw new ConflictError("Primero debes desactivar el grupo")
  }

  const teacherAccount = await prisma.linuxAccount.findUnique({
    where: { user_id: group.teacher_id },
  })
  const groupName = `grp_${group.id.replace(/-/g, "").substring(0, 8)}`

  // Se anotan antes del teardown porque despues de borrar las matriculas ya no
  // hay forma de saber a quien se le elimino la cuenta. Los usernames pueden
  // venir vacios: al archivar ya se borraron las filas de linux_accounts y los
  // usuarios los elimino el teardown job; este pasada de respaldo se queda con
  // el grupo Unix y la carpeta.
  const enrolled = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    select: {
      student: {
        select: { id: true, linuxAccount: { select: { linux_username: true } } },
      },
    },
  })
  const studentIds = enrolled.map((e) => e.student.id)
  const usernames = enrolled
    .map((e) => e.student.linuxAccount?.linux_username)
    .filter(Boolean)

  if (teacherAccount?.linux_username && group.group_dir) {
    try {
      await linuxContainerService.teardownGroup({
        teacherUsername: teacherAccount.linux_username,
        groupDir: group.group_dir,
        groupName,
        usernames,
      })
    } catch (err) {
      // El contenedor puede estar caido o el directorio ya no existir. Se
      // registra y se sigue: dejar la fila viva obligaria a repetir el borrado
      // y el docente no tiene forma de resolverlo desde la interfaz.
      logger.error({ err, groupId }, "Linux teardown failed, deleting group anyway")
    }
  }

  await prisma.$transaction([
    // El teardown hizo userdel de cada estudiante, asi que su cuenta Linux ya
    // no existe. Sin bajar esta marca la matricula en un grupo nuevo no encola
    // aprovisionamiento (ver enrollmentService) y el estudiante se queda para
    // siempre sin cuenta con la que abrir la terminal.
    prisma.linuxAccount.updateMany({
      where: { user_id: { in: studentIds } },
      data: { linux_provisioned: false },
    }),
    prisma.enrollment.deleteMany({ where: { group_id: groupId } }),
    prisma.groupProvisioningJob.deleteMany({ where: { group_id: groupId } }),
    prisma.groupTeardownJob.deleteMany({ where: { group_id: groupId } }),
    // El group_id es opcional aqui: se desliga en vez de borrarse para no
    // perder el rastro de las cuentas que si se llegaron a crear.
    prisma.userProvisioningJob.updateMany({
      where: { group_id: groupId },
      data: { group_id: null },
    }),
    prisma.group.delete({ where: { id: groupId } }),
  ])

  logger.info({ groupId, teacherUserId }, "Group deleted")
}

module.exports = {
  createGroup,
  listGroups,
  getGroup,
  getGroupAccess,
  archiveGroup,
  deleteGroup,
  serializeGroup,
}
