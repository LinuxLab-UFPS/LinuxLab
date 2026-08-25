const prisma = require("../../prisma/client")
const accessService = require("./accessService")

const PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

/** Descripcion corta de cada tipo de evento, para la UI. */
const ACTION_LABELS = {
  auth_login: "Inicio de sesión",
  auth_logout: "Cierre de sesión",
  activity_submitted: "Entrega de actividad",
  activity_checked: "Validación de actividad",
  activity_graded: "Calificación",
  activity_created: "Actividad creada",
  activity_updated: "Actividad actualizada",
  activity_enabled: "Actividad habilitada",
  activity_disabled: "Actividad deshabilitada",
  activity_due_extended: "Plazo extendido",
  teacher_registered: "Docente registrado",
  teacher_toggled: "Estado de docente",
  group_created: "Curso creado",
  group_archived: "Curso archivado",
  group_deleted: "Curso eliminado",
  student_registered: "Matrícula de estudiante",
  csv_imported: "Importación vía CSV",
}

/** Etiqueta de cada tipo de evento para los filtros agrupados de la UI. */
const EVENT_CATEGORY_LABEL = {
  sesiones: "Sesiones",
  actividades: "Actividades",
  administracion: "Administración",
  cursos: "Cursos",
  matriculas: "Matrículas",
}

/** Agrupacion de event_types por categoria (Select agrupado de la UI). */
const EVENT_CATEGORIES = {
  sesiones: ["auth_login", "auth_logout"],
  actividades: [
    "activity_submitted",
    "activity_checked",
    "activity_graded",
    "activity_created",
    "activity_updated",
    "activity_enabled",
    "activity_disabled",
    "activity_due_extended",
  ],
  administracion: ["teacher_registered", "teacher_toggled"],
  cursos: ["group_created", "group_archived", "group_deleted"],
  matriculas: ["student_registered", "csv_imported"],
}

/** Nombres de los grupos pedidos, en un solo lote (evita N+1). */
async function groupNamesByIds(groupIds) {
  const ids = [...new Set(groupIds.filter(Boolean))]
  if (ids.length === 0) return new Map()
  const groups = await prisma.group.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  })
  return new Map(groups.map((g) => [g.id, g.name]))
}

function serializeEntry(e, groupNames = new Map()) {
  return {
    id: e.id,
    timestamp: e.created_at.toISOString(),
    userId: e.user_id,
    userName: e.user?.name ?? null,
    email: e.user?.email ?? null,
    role: e.user?.role ?? e.user_role ?? null,
    eventType: e.event_type,
    action: ACTION_LABELS[e.event_type] ?? e.event_type,
    message: e.message,
    target: null,
    groupId: e.group_id ?? null,
    groupName: e.group_id ? (groupNames.get(e.group_id) ?? null) : null,
    metadata: null,
  }
}

/**
 * Lista eventos de la bitacora con el control de acceso por rol:
 * - admin ve todo el sistema.
 * - docente ve lo de sus grupos y sus propios inicios/cierres de sesion
 *   (los de sus estudiantes estan ligados al grupo activo).
 * Filtros opcionales: eventType, groupId, from, to, search, page, limit.
 */
async function listAuditEvents({ role, userId, filters = {} }) {
  const where = {}
  const groupId = filters.groupId || null

  if (role !== "admin") {
    const myGroups = await prisma.group.findMany({
      where: { teacher_id: userId },
      select: { id: true },
    })
    const myGroupIds = myGroups.map((g) => g.id)
    // Si el docente pide un curso concreto suyo, se filtra a ese curso (sin
    // mezclar sus propias sesiones). Si no, ve sus cursos y sus sesiones.
    if (groupId && myGroupIds.includes(groupId)) {
      where.group_id = groupId
    } else {
      where.OR = [
        { group_id: { in: myGroupIds } },
        { AND: [{ user_id: userId }, { event_type: { startsWith: "auth_" } }] },
      ]
    }
  } else if (groupId) {
    where.group_id = groupId
  }

  // Filtro por categoria (grupo de event_types) o por tipo individual.
  const categoryEvents = filters.category ? EVENT_CATEGORIES[filters.category] : null
  if (categoryEvents && categoryEvents.length > 0) {
    where.event_type = { in: categoryEvents }
  } else if (filters.eventType) {
    where.event_type = filters.eventType
  }
  if (filters.from || filters.to) {
    where.created_at = {}
    if (filters.from) where.created_at.gte = new Date(`${filters.from}T00:00:00.000Z`)
    if (filters.to) where.created_at.lte = new Date(`${filters.to}T23:59:59.999Z`)
  }
  if (filters.search) {
    const q = filters.search
    where.AND = [
      ...(where.AND ?? []),
      {
        OR: [
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { message: { contains: q, mode: "insensitive" } },
        ],
      },
    ]
  }

  const limit = Math.min(Number(filters.limit) || PAGE_SIZE, MAX_PAGE_SIZE)
  const page = Math.max(Number(filters.page) || 1, 1)

  const [total, rows] = await Promise.all([
    prisma.auditEvent.count({ where }),
    prisma.auditEvent.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  const groupNames = await groupNamesByIds(rows.map((r) => r.group_id))

  return {
    entries: rows.map((r) => serializeEntry(r, groupNames)),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

/**
 * Ultimos N eventos de un curso, para el panel "Actividad reciente" del
 * resumen. Verifica que el solicitante tenga acceso al grupo.
 */
async function listGroupAuditEvents({ groupId, role, userId, limit = 10 }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId: userId, role })
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } })
  const groupNames = new Map([[groupId, group?.name ?? null]])

  const rows = await prisma.auditEvent.findMany({
    where: { group_id: groupId },
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { created_at: "desc" },
    take: limit,
  })
  return rows.map((r) => serializeEntry(r, groupNames))
}

module.exports = { listAuditEvents, listGroupAuditEvents, serializeEntry, EVENT_CATEGORIES, EVENT_CATEGORY_LABEL }
