const { randomUUID } = require("crypto")
const prisma = require("../../prisma/client")
const enrollmentService = require("./enrollmentService")
const containerService = require("./containerService")
const logger = require("../lib/logger")
const { AppError, ConflictError } = require("../lib/errors")
const { runInTransaction } = require("../lib/transaction")
const accessService = require("./accessService")
const { groupNameOf } = require("../utils/groupName")
const { createGroupSchema, serializeGroup } = require("../dtos/groupDtos")
const { parseOrThrow } = require("../dtos/common")
const { serializeGroupUserJob } = require("../dtos/provisioningDtos")
const { finalScore } = require("../utils/finalScore")

function generateGroupDir(groupNumber) {
  return `G-${String(groupNumber).padStart(4, "0")}`
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

async function createGroup(args) {
  if (!args.tx) {
    return runInTransaction((tx) => createGroup({ ...args, tx }))
  }

  const { name, description, students, teacherUserId, tx } = args
  const db = tx
  const parsed = parseOrThrow(createGroupSchema, {
    name,
    description,
    students: Array.isArray(students) ? students : [],
  })
  await ensureTeacherRole(teacherUserId, db)

  const teacherAccount = await db.linuxAccount.findUnique({
    where: { user_id: teacherUserId },
  })

  if (!teacherAccount?.linux_provisioned) {
    throw new ConflictError(
      "Tu cuenta Linux aún no está provisionada en el entorno. Espera a que termine el aprovisionamiento y vuelve a intentar crear el grupo.",
    )
  }

  const groupId = randomUUID()
  const groupName = groupNameOf(groupId)
  const createdGroup = await db.group.create({
    data: {
      id: groupId,
      name: parsed.name,
      description: parsed.description?.trim() || null,
      teacher_id: teacherUserId,
      group_dir: null,
    },
  })
  const groupDir = generateGroupDir(createdGroup.group_number)
  const group = await db.group.update({
    where: { id: createdGroup.id },
    data: { group_dir: groupDir },
  })

  await db.groupProvisioningJob.create({
    data: {
      group_id: group.id,
      group_dir: groupDir,
      group_name: groupName,
      teacher_username: teacherAccount.linux_username,
    },
  })

  const enrollment = await enrollmentService.enrollMany({
    groupId: group.id,
    students: parsed.students,
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
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const withCount = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { enrollments: true, groupActivities: true } },
    },
  })

  const activeNowRows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS cnt
    FROM "User" u
    JOIN enrollments e ON e.student_id = u.id
    WHERE e.group_id = ${groupId}
      AND u.last_login IS NOT NULL
      AND u.last_login > NOW() - INTERVAL '5 minutes'
  `
  const activeNow = activeNowRows[0]?.cnt ?? 0

  const activities = await prisma.groupActivity.findMany({
    where: { group_id: groupId },
    select: { id: true },
  })

  let totalScore = 0
  let studentCount = 0
  for (const act of activities) {
    const grouped = await prisma.activityAttempt.groupBy({
      by: ["student_id"],
      where: { group_activity_id: act.id },
      _count: { id: true },
    })
    for (const g of grouped) {
      const attempts = await prisma.activityAttempt.findMany({
        where: { group_activity_id: act.id, student_id: g.student_id },
        orderBy: { created_at: "desc" },
        select: { score: true, created_at: true },
      })
      totalScore += finalScore(attempts)
      studentCount++
    }
  }
  const averageScore = studentCount > 0 ? Math.round((totalScore / studentCount) * 10) / 10 : null

  return serializeGroup(withCount, withCount._count.enrollments, withCount._count.groupActivities, { activeNow, averageScore })
}

/**
 * Jobs de aprovisionamiento de los estudiantes de un grupo. Exige el mismo
 * control de acceso que el resto de los endpoints por grupo: sin la
 * verificacion, cualquier docente podria leer la informacion personal
 * (nombre, correo, codigo, estado de la cuenta) de los estudiantes de cursos
 * ajenos iterando ids de grupo.
 */
async function listGroupProvisioningJobs({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const enrollments = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    select: { student: { select: { id: true } } },
  })
  const userIds = enrollments.map((enrollment) => enrollment.student.id)
  const jobs = await prisma.userProvisioningJob.findMany({
    where: { user_id: { in: userIds } },
    include: {
      user: {
        select: { name: true, email: true, code: true },
      },
    },
    orderBy: { created_at: "desc" },
  })
  return jobs.map(serializeGroupUserJob)
}

/**
 * Resumen de aprovisionamiento del docente (para el indicador global): cuentas
 * en proceso, listas y fallidas entre los jobs de estudiantes de sus grupos
 * activos. Solo cuenta jobs recientes (una hora) para que el progreso X/N no
 * se contamine con cohortes viejas ya terminadas.
 */
async function teacherProvisioningSummary({ teacherUserId }) {
  const since = new Date(Date.now() - 60 * 60 * 1000)
  const jobs = await prisma.userProvisioningJob.findMany({
    where: {
      group: { teacher_id: teacherUserId, archived: false },
      created_at: { gte: since },
    },
    select: { status: true },
  })

  let pending = 0
  let completed = 0
  let failed = 0
  for (const job of jobs) {
    if (job.status === "pending" || job.status === "processing") {
      pending += 1
    } else if (job.status === "completed") {
      completed += 1
    } else if (job.status === "failed") {
      failed += 1
    }
  }
  return { pending, completed, failed, total: jobs.length }
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
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role, tx })
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
        group_name: groupNameOf(groupId),
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
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  if (!group.archived) {
    throw new ConflictError("Primero debes desactivar el grupo")
  }

  const teacherAccount = await prisma.linuxAccount.findUnique({
    where: { user_id: group.teacher_id },
  })
  const groupName = groupNameOf(group.id)

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
      await containerService.teardownGroup({
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

  await runInTransaction(async (tx) => {
    // El teardown hizo userdel de cada estudiante, asi que su cuenta Linux ya
    // no existe. Sin bajar esta marca la matricula en un grupo nuevo no encola
    // aprovisionamiento (ver enrollmentService) y el estudiante se queda para
    // siempre sin cuenta con la que abrir la terminal.
    await tx.linuxAccount.updateMany({
      where: { user_id: { in: studentIds } },
      data: { linux_provisioned: false },
    })
    await tx.enrollment.deleteMany({ where: { group_id: groupId } })
    await tx.groupProvisioningJob.deleteMany({ where: { group_id: groupId } })
    await tx.groupTeardownJob.deleteMany({ where: { group_id: groupId } })
    // El group_id es opcional aqui: se desliga en vez de borrarse para no
    // perder el rastro de las cuentas que si se llegaron a crear.
    await tx.userProvisioningJob.updateMany({
      where: { group_id: groupId },
      data: { group_id: null },
    })
    await tx.group.delete({ where: { id: groupId } })
  })

  logger.info({ groupId, teacherUserId }, "Group deleted")
}

module.exports = {
  createGroup,
  listGroups,
  getGroup,
  listGroupProvisioningJobs,
  teacherProvisioningSummary,
  archiveGroup,
  deleteGroup,
}
