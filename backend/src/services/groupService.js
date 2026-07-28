const prisma = require("../../prisma/client")
const enrollmentService = require("./enrollmentService")

class ServiceError extends Error {
  constructor(message, status) {
    super(message)
    this.name = "ServiceError"
    this.status = status
  }
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

  const enrollment = await enrollStudentsInGroup({
    groupId: group.id,
    students: Array.isArray(students) ? students : [],
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

async function enrollStudentsInGroup({ groupId, students }) {
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

module.exports = {
  createGroup,
  listGroups,
  getGroup,
  archiveGroup,
  ServiceError,
  serializeGroup,
}
