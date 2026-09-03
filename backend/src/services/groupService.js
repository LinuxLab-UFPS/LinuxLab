const { randomUUID, randomBytes } = require("crypto")
const prisma = require("../../prisma/client")
const enrollmentService = require("./enrollmentService")
const containerService = require("./containerService")
const logger = require("../lib/logger")
const { AppError, ConflictError } = require("../lib/errors")
const config = require("../config/env")
const { runInTransaction } = require("../lib/transaction")
const accessService = require("./accessService")
const attemptService = require("./attemptService")
const { groupNameOf } = require("../utils/groupName")
const { createGroupSchema, updateGroupSchema, serializeGroup } = require("../dtos/groupDtos")
const { parseOrThrow } = require("../dtos/common")
const { serializeGroupUserJob } = require("../dtos/provisioningDtos")
const { finalScore } = require("../utils/finalScore")
const { PRIORITIES } = require("../lib/constants")
const finalizationService = require("./finalizationService")
const certificateService = require("./certificateService")
const auditService = require("./auditService")

function generateGroupDir(groupNumber) {
  return `G-${String(groupNumber).padStart(4, "0")}`
}

function generateInviteToken() {
  return randomBytes(32).toString("hex")
}

function buildInviteUrl(groupId, token) {
  return `${config.frontendUrl}/inscripcion?token=${encodeURIComponent(token)}&group=${encodeURIComponent(groupId)}`
}

async function rotateInvite({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const token = generateInviteToken()
  await prisma.group.update({
    where: { id: groupId },
    data: { invite_token: token },
  })
  return { inviteUrl: buildInviteUrl(groupId, token) }
}

async function ensureTeacherRole(userId, tx = prisma) {
  const teacher = await tx.teacher.findUnique({
    where: { user_id: userId },
    select: { user_id: true },
  })
  if (!teacher) {
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
      invite_token: generateInviteToken(),
    },
  })
  const groupDir = generateGroupDir(createdGroup.group_number)
  const group = await db.group.update({
    where: { id: createdGroup.id },
    data: { group_dir: groupDir },
  })

  await db.job.create({
    data: {
      type: "group_provisioning",
      priority: 5,
      group_id: group.id,
      payload: {
        group_dir: groupDir,
        group_name: groupName,
        teacher_username: teacherAccount.linux_username,
      },
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
      teacher: { select: { user: { select: { name: true } } } },
      _count: { select: { enrollments: true, groupActivities: true } },
    },
  })

  auditService.audit({
    userId: teacherUserId,
    groupId: group.id,
    eventType: "group_created",
    target: parsed.name,
    metadata: {
      groupId: group.id,
      enrolled: enrollment.registered,
      skipped: enrollment.skipped,
    },
  })

  return {
    group: serializeGroup(withCount, withCount._count.enrollments, withCount._count.groupActivities, {
      topicActivityCount: await attemptService.topicActivitiesTotal(),
    }),
    enrollment,
  }
}

/**
 * Actualiza los datos editables de un grupo (nombre y descripcion).
 *
 * Solo los grupos activos son editables: un grupo finalizado o archivado es
 * un registro historico y sus datos quedan congelados tal como se cerraron.
 */
async function updateGroup({ groupId, name, description, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const parsed = parseOrThrow(updateGroupSchema, { name, description })

  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group) {
    // ensureGroupAccess ya la habria rechazado, pero el chequeo explícito
    // documenta la expectativa y protege ante cambios futuros.
    throw new AppError("Grupo no encontrado", 404, "NOT_FOUND")
  }
  if (group.status !== "active") {
    throw new AppError("Solo se puede editar un grupo activo", 409, "CONFLICT")
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      name: parsed.name,
      description: parsed.description?.trim() || null,
    },
  })

  auditService.audit({
    userId: teacherUserId,
    groupId,
    eventType: "group_updated",
    target: parsed.name,
    metadata: { groupId },
  })

  return serializeGroup(updated, 0)
}

async function listGroups({ teacherUserId, role }) {
  // Una sola consulta para todos los grupos: el temario es el mismo en todos.
  const delTemario = await attemptService.topicActivitiesTotal()
  if (role === "admin") {
    const groups = await prisma.group.findMany({
      include: {
        teacher: { select: { user: { select: { name: true } } } },
        _count: { select: { enrollments: true, groupActivities: true } },
      },
      orderBy: { created_at: "desc" },
    })
    return groups.map((g) =>
      serializeGroup(g, g._count.enrollments, g._count.groupActivities, { topicActivityCount: delTemario }),
    )
  }
  const groups = await prisma.group.findMany({
    where: { teacher_id: teacherUserId },
    include: { _count: { select: { enrollments: true, groupActivities: true } } },
    orderBy: { created_at: "desc" },
  })
  return groups.map((g) =>
    serializeGroup(g, g._count.enrollments, g._count.groupActivities, { topicActivityCount: delTemario }),
  )
}

async function getGroup({ groupId, teacherUserId, role }) {
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const withCount = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      teacher: { select: { user: { select: { name: true } } } },
      _count: { select: { enrollments: true, groupActivities: true } },
    },
  })

  const activeNowRows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS cnt
    FROM "User" u
    JOIN "Enrollment" e ON e.student_id = u.id
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
    const submissions = await prisma.groupSubmission.findMany({
      where: { group_activity_id: act.id },
      select: { enrollment_id: true, passed: true, score: true },
    })
    const byStudent = new Map()
    for (const s of submissions) {
      if (!byStudent.has(s.enrollment_id)) byStudent.set(s.enrollment_id, [])
      byStudent.get(s.enrollment_id).push({ score: s.score, passed: s.passed })
    }
    for (const [, scores] of byStudent) {
      totalScore += finalScore(scores.map((s) => ({ score: s.score })))
      studentCount++
    }
  }
  const averageScore = studentCount > 0 ? Math.round((totalScore / studentCount) * 10) / 10 : null

  return serializeGroup(withCount, withCount._count.enrollments, withCount._count.groupActivities, {
    activeNow,
    averageScore,
    topicActivityCount: await attemptService.topicActivitiesTotal(),
  })
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
    select: { student: { select: { user_id: true } } },
  })
  const userIds = enrollments.map((enrollment) => enrollment.student.user_id)
  const jobs = await prisma.job.findMany({
    where: { type: "user_provisioning", user_id: { in: userIds } },
    include: {
      user: {
        select: { name: true, email: true, student: { select: { code: true } } },
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
  const jobs = await prisma.job.findMany({
    where: {
      type: "user_provisioning",
      group: { teacher_id: teacherUserId, status: "active" },
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
 * Finaliza un grupo: el cierre academico del curso. Es la unica via de salida
 * de 'active' en el modelo nuevo y es irreversible.
 *
 * En una sola transaccion:
 * 1. Evalua la regla de certificacion y emite los certificados (estudiante por
 *    matricula elegible + el de instructor del grupo), con los datos congelados.
 * 2. Encola los jobs de correo: uno por certificado y uno para el docente con
 *    el acta y su certificado de instructor.
 * 3. Destruye el entorno y cierra las matriculas (la misma limpieza del
 *    archivado): los estudiantes quedan liberados para matricularse en otro
 *    grupo y su curso se entrega por correo.
 */
async function finalizeGroup({ groupId, role, teacherUserId }) {
  return runInTransaction(async (tx) => {
    await accessService.ensureGroupAccess({ groupId, teacherUserId, role, tx })

    // Serializa dos finalizaciones concurrentes sobre la misma fila.
    await tx.$queryRaw`SELECT id FROM "Group" WHERE id = ${groupId} FOR UPDATE`

    const group = await tx.group.findUnique({
      where: { id: groupId },
      include: { teacher: { select: { user: { select: { name: true } } } } },
    })
    if (group.status !== "active") {
      // Re-chequeo bajo lock: otra finalizacion pudo ganar la carrera.
      throw new AppError("Solo se puede finalizar un grupo activo", 409, "CONFLICT")
    }

    const summary = await finalizationService.computeGroupSummary(group, tx)
    const { certificates, instructorCertificate } = await certificateService.issueForGroup(tx, {
      group,
      summary,
    })

    const emailJobs = certificates.map((certificate) => {
      const student = summary.students.find((s) => s.enrollmentId === certificate.enrollment_id)
      return {
        type: "certificate_email",
        priority: PRIORITIES.STUDENT,
        group_id: groupId,
        payload: { kind: "student", code: certificate.code, email: student?.email },
      }
    })
    emailJobs.push({
      type: "certificate_email",
      priority: PRIORITIES.TEACHER,
      group_id: groupId,
      payload: { kind: "teacher", groupId },
    })
    await tx.job.createMany({ data: emailJobs })

    const updated = await deactivateGroupEnvironment(tx, {
      groupId,
      group,
      teacherUserId,
      nextStatus: "finished",
    })

    auditService.audit({
      userId: teacherUserId,
      groupId,
      eventType: "group_finished",
      target: group.name,
      metadata: {
        groupId,
        certificatesIssued: certificates.length,
        eligible: summary.summary.eligibleCount,
        total: summary.summary.total,
      },
    })

    return {
      group: serializeGroup(updated, 0),
      summary: {
        certificatesIssued: certificates.length,
        eligibleCount: summary.summary.eligibleCount,
        total: summary.summary.total,
        instructorCode: instructorCertificate.code,
      },
    }
  })
}

/**
 * Archiva un grupo. Es un movimiento de organizacion del listado: solo aplica
 * a grupos ya finalizados, cuyo entorno se destruyo al finalizar, y no toca
 * nada mas que el estado.
 *
 * Modo de compatibilidad: archivar un grupo 'active' conserva el comportamiento
 * previo (destruye el entorno y cierra matriculas) mientras la UI nueva de
 * finalizacion no este desplegada. Una vez la UI solo ofrezca finalizar, esta
 * via se elimina y el archivado exigira 'finished'.
 */
async function archiveGroup(args) {
  if (!args.tx) return runInTransaction((tx) => archiveGroup({ ...args, tx }))

  const { groupId, role, teacherUserId, tx } = args
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role, tx })
  if (group.status === "archived") {
    throw new AppError("El grupo ya está archivado", 409, "CONFLICT")
  }

  if (group.status === "finished") {
    const updated = await tx.group.update({
      where: { id: groupId },
      data: { status: "archived" },
    })
    auditService.audit({
      userId: teacherUserId,
      groupId,
      eventType: "group_archived",
      target: group.name,
      metadata: { groupId },
    })
    return serializeGroup(updated, 0)
  }

  const updated = await deactivateGroupEnvironment(tx, {
    groupId,
    group,
    teacherUserId,
    nextStatus: "archived",
  })

  auditService.audit({
    userId: teacherUserId,
    groupId,
    eventType: "group_archived",
    target: group.name,
    metadata: { groupId },
  })

  return serializeGroup(updated, 0)
}

/**
 * Desarchiva un grupo: lo devuelve al listado principal del docente.
 *
 * El estado de destino es siempre 'finished': con la UI nueva el archivado
 * solo aplica a grupos ya finalizados, y los pocos grupos que se archivaron
 * estando activos (modo de compatibilidad) tienen su entorno destruido, asi
 * que volver a 'active' los dejaria con un curso vivo sin entorno Linux.
 * No toca nada mas que el estado: es el inverso exacto del archivado simple.
 */
async function unarchiveGroup({ groupId, role, teacherUserId }) {
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  if (group.status !== "archived") {
    throw new AppError("Solo se puede desarchivar un grupo archivado", 409, "CONFLICT")
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { status: "finished" },
  })

  auditService.audit({
    userId: teacherUserId,
    groupId,
    eventType: "group_unarchived",
    target: group.name,
    metadata: { groupId },
  })

  return serializeGroup(updated, 0)
}

/**
 * La limpieza que cierra un curso: matriculas a 'archived', cuentas Linux de
 * los estudiantes borradas de la base, jobs de aprovisionamiento pendientes
 * cancelados y teardown del entorno encolado. El worker borra del contenedor
 * los usuarios de los matriculados (los usernames se conservan en el job
 * porque las filas se acaban de borrar) y la carpeta del grupo.
 *
 * Corre dentro de la transaccion del llamador, que fija el estado final con
 * nextStatus ('finished' al finalizar, 'archived' en el modo de compatibilidad).
 */
async function deactivateGroupEnvironment(tx, { groupId, group, teacherUserId, nextStatus }) {
  const [enrollments, teacherAccount] = await Promise.all([
    tx.enrollment.findMany({
      where: { group_id: groupId },
      include: { student: { include: { user: { include: { linuxAccount: true } } } } },
    }),
    tx.linuxAccount.findUnique({ where: { user_id: teacherUserId } }),
  ])
  const studentIds = enrollments.map((e) => e.student_id)
  const usernames = enrollments
    .map((e) => e.student.user?.linuxAccount?.linux_username)
    .filter(Boolean)

  const updated = await tx.group.update({
    where: { id: groupId },
    data: { status: nextStatus },
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
  await tx.job.deleteMany({ where: { group_id: groupId, type: { in: ["user_provisioning", "group_provisioning"] } } })

  if (teacherAccount?.linux_username && group.group_dir) {
    await tx.job.create({
      data: {
        type: "group_teardown",
        priority: 0,
        group_id: groupId,
        payload: {
          group_dir: group.group_dir,
          group_name: groupNameOf(groupId),
          teacher_username: teacherAccount.linux_username,
          usernames,
        },
      },
    })
  } else {
    logger.warn({ groupId }, "Teacher not provisioned, teardown job skipped")
  }

  return updated
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
  if (group.status !== "archived") {
    throw new ConflictError("Primero debes desactivar el grupo")
  }

  const teacherAccount = await prisma.linuxAccount.findUnique({
    where: { user_id: group.teacher_id },
  })
  const groupName = groupNameOf(group.id)

  // Se anotan antes del teardown porque despues de borrar las matriculas ya no
  // hay forma de saber a quien se le elimino la cuenta. Los usernames pueden
  // venir vacios: al archivar ya se borraron las filas de linux_accounts y los
  // usuarios los elimino el teardown job; esta pasada de respaldo se queda con
  // el grupo Unix y la carpeta.
  const enrolled = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    select: {
      student: {
        select: { user_id: true, linuxAccount: { select: { linux_username: true } } },
      },
    },
  })
  const studentIds = enrolled.map((e) => e.student.user_id)
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
    await tx.job.deleteMany({ where: { group_id: groupId } })
    await tx.group.delete({ where: { id: groupId } })
  })

  auditService.audit({
    userId: teacherUserId,
    groupId,
    eventType: "group_deleted",
    target: group.name,
    metadata: { groupId, teacherName: group.teacher?.user?.name },
  })

  logger.info({ groupId, teacherUserId }, "Group deleted")
}

module.exports = {
  createGroup,
  updateGroup,
  listGroups,
  getGroup,
  listGroupProvisioningJobs,
  teacherProvisioningSummary,
  archiveGroup,
  unarchiveGroup,
  finalizeGroup,
  deleteGroup,
  rotateInvite,
}
