const prisma = require("../../prisma/client")
const enrollmentService = require("./enrollmentService")
const provisioningWorker = require("./provisioningWorker")
const linuxContainerService = require("./linuxContainerService")
const logger = require("../lib/logger")

class ServiceError extends Error {
  constructor(message, status) {
    super(message)
    this.name = "ServiceError"
    this.status = status
  }
}

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

function serializeGroup(group, studentCount) {
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? "",
    archived: group.archived,
    createdAt: group.created_at,
    teacherId: group.teacher_id,
    teacherName: group.teacher?.user?.name ?? null,
    studentCount: studentCount ?? 0,
    enabledTopics: [],
    activityCount: 0,
  }
}

async function ensureTeacherProfile(userId) {
  const profile = await prisma.teacher.findUnique({ where: { user_id: userId } })
  if (!profile) {
    throw new ServiceError("El usuario autenticado no tiene perfil de docente", 403)
  }
  return profile
}

async function getGroupAccess({ groupId, teacherUserId, role }) {
  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group) {
    throw new ServiceError("Grupo no encontrado", 404)
  }
  if (role !== "admin" && group.teacher_id !== teacherUserId) {
    throw new ServiceError("No tienes permiso sobre este grupo", 403)
  }
  return group
}

async function createGroup({ name, description, students, teacherUserId }) {
  if (!name?.trim()) {
    throw new ServiceError("El nombre del grupo es requerido", 400)
  }
  await ensureTeacherProfile(teacherUserId)

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      teacher_id: teacherUserId,
    },
  })

  const groupDir = generateGroupDir(name, group.id)
  const groupName = `grp_${group.id.replace(/-/g, "").substring(0, 8)}`

  await prisma.group.update({
    where: { id: group.id },
    data: { group_dir: groupDir },
  })

  const teacherAccount = await prisma.linuxAccount.findUnique({
    where: { user_id: teacherUserId },
  })

  if (teacherAccount?.linux_provisioned) {
    await prisma.groupProvisioningJob.create({
      data: {
        group_id: group.id,
        group_dir: groupDir,
        group_name: groupName,
        teacher_username: teacherAccount.linux_username,
      },
    })
    provisioningWorker.processPendingJobs()
  } else {
    logger.warn({ teacherUserId }, "Teacher not provisioned yet, group dir will be created after teacher provisioning")
  }

  const teacherAccount2 = await prisma.linuxAccount.findUnique({
    where: { user_id: teacherUserId },
  })
  const teacherUsername = teacherAccount2?.linux_username

  const enrollment = await enrollStudentsInGroup({
    groupId: group.id,
    students: Array.isArray(students) ? students : [],
    groupDir,
    groupName,
    teacherUsername,
  })

  const withCount = await prisma.group.findUnique({
    where: { id: group.id },
    include: { _count: { select: { enrollments: true } } },
  })
  return {
    group: serializeGroup(withCount, withCount._count.enrollments),
    enrollment,
  }
}

async function enrollStudentsInGroup({ groupId, students, groupDir, groupName, teacherUsername }) {
  const result = {
    total: students.length,
    registered: 0,
    skipped: 0,
    errors: [],
  }
  for (let i = 0; i < students.length; i++) {
    const s = students[i] ?? {}
    try {
      const outcome = await enrollmentService.enrollOne({
        groupId,
        name: s.name,
        email: s.email,
        code: s.code,
        groupDir,
        groupName,
        teacherUsername,
      })
      if (outcome.enrolled) {
        result.registered += 1
      } else {
        result.skipped += 1
      }
    } catch (err) {
      result.errors.push({
        row: i + 1,
        email: s?.email ?? null,
        error: err instanceof enrollmentService.ServiceError ? err.message : err?.message || String(err),
      })
    }
  }
  return result
}

async function listGroups({ teacherUserId, role }) {
  if (role === "admin") {
    const groups = await prisma.group.findMany({
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { created_at: "desc" },
    })
    return groups.map((g) => serializeGroup(g, g._count.enrollments))
  }
  const groups = await prisma.group.findMany({
    where: { teacher_id: teacherUserId },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { created_at: "desc" },
  })
  return groups.map((g) => serializeGroup(g, g._count.enrollments))
}

async function getGroup({ groupId, teacherUserId, role }) {
  const group = await getGroupAccess({ groupId, teacherUserId, role })
  const withCount = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      _count: { select: { enrollments: true } },
    },
  })
  return serializeGroup(withCount, withCount._count.enrollments)
}

async function archiveGroup({ groupId, role, teacherUserId }) {
  const group = await getGroupAccess({ groupId, teacherUserId, role })
  if (group.archived) {
    throw new ServiceError("El grupo ya está archivado", 409)
  }
  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { archived: true },
  })
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
    throw new ServiceError("Primero debes desactivar el grupo", 409)
  }

  const teacherAccount = await prisma.linuxAccount.findUnique({
    where: { user_id: group.teacher_id },
  })
  const groupName = `grp_${group.id.replace(/-/g, "").substring(0, 8)}`

  // Se anotan antes del teardown porque despues de borrar las matriculas ya no
  // hay forma de saber a quien se le elimino la cuenta.
  const enrolled = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    select: { student_id: true },
  })

  if (teacherAccount?.linux_username && group.group_dir) {
    try {
      await linuxContainerService.archiveGroup(
        teacherAccount.linux_username,
        group.group_dir,
        groupName,
      )
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
      where: { user_id: { in: enrolled.map((e) => e.student_id) } },
      data: { linux_provisioned: false },
    }),
    prisma.enrollment.deleteMany({ where: { group_id: groupId } }),
    prisma.groupProvisioningJob.deleteMany({ where: { group_id: groupId } }),
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
  archiveGroup,
  deleteGroup,
  ServiceError,
  serializeGroup,
}
