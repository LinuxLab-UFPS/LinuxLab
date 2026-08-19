const prisma = require("../../prisma/client")
const logger = require("../lib/logger")

function nombreDe(u) {
  const name = u?.name ?? u?.teacher?.name
  return name ? name : "Un usuario"
}

/**
 * Redactores de mensaje legible por tipo de evento. Cada builder recibe un
 * contexto resuelto por `audit()`: `actorName` (nombre del que acciona),
 * `target` (objeto sobre el que se actua) y `metadata` (detalles). Pueden
 * resolver datos extra (nombre del estudiante, del curso) con `prisma`.
 * Devuelven la frase en espanol que se guarda en la columna `message`.
 */
const MESSAGE_BUILDERS = {
  // --- Sesiones ---
  auth_login: ({ actorName, group }) =>
    `${actorName} inició sesión${group ? ` en el curso ${group.name}` : ""}.`,
  auth_logout: ({ actorName }) => `${actorName} cerró sesión.`,

  // --- Actividades (entrega, validacion y gestion) ---
  activity_submitted: ({ actorName, target }) =>
    `${actorName} entregó la actividad '${target}'.`,
  activity_checked: ({ actorName, target, metadata }) =>
    `${actorName} validó la actividad '${target}' (${metadata?.passed ? "aprobó" : "no aprobó"}, ${metadata?.score ?? 0} pts).`,
  activity_graded: async ({ actorName, target, metadata }) => {
    const studentName = await userNameOf(metadata?.studentId)
    return `${actorName} calificó la entrega de ${studentName} en '${target}' con ${metadata?.score ?? 0} pts.`
  },
  activity_created: ({ actorName, target }) => `${actorName} creó la actividad '${target}'.`,
  activity_updated: ({ actorName, target }) => `${actorName} actualizó la actividad '${target}'.`,
  activity_enabled: ({ actorName, target }) => `${actorName} habilitó la actividad '${target}'.`,
  activity_disabled: ({ actorName, target }) => `${actorName} deshabilitó la actividad '${target}'.`,
  activity_due_extended: ({ actorName, target }) =>
    `${actorName} extendió la fecha de entrega de la actividad '${target}'.`,

  // --- Administracion ---
  teacher_registered: ({ actorName, target }) => `${actorName} registró al docente '${target}'.`,
  teacher_toggled: ({ actorName, target, metadata }) =>
    `${actorName} ${metadata?.active ? "activó" : "desactivó"} al docente '${target}'.`,

  // --- Grupos ---
  group_created: ({ actorName, target }) => `${actorName} creó el curso '${target}'.`,
  group_archived: ({ actorName, target }) => `${actorName} archivó el curso '${target}'.`,
  group_deleted: ({ actorName, target }) => `${actorName} eliminó el curso '${target}'.`,

  // --- Matriculas ---
  student_registered: ({ actorName, target, group, metadata }) =>
    `${actorName} matriculó a '${metadata?.studentName ?? target}'${group ? ` en el curso ${group.name}` : ""}.`,
  csv_imported: ({ actorName, metadata }) =>
    `${actorName} importó ${metadata?.registered ?? 0} estudiante(s) vía CSV${metadata?.skipped ? ` (${metadata.skipped} omitidos)` : ""}.`,
}

/** Resuelve el nombre de un usuario por id; devuelve un fallback legible. */
async function userNameOf(userId) {
  if (!userId) return "un usuario"
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  return user ? `'${user.name}'` : "un usuario"
}

/** Mensaje de respaldo si el event_type no tiene redactor. */
function fallbackMessage(eventType, target) {
  return `Acción (${eventType}) sobre ${target ?? "sin objeto"}.`
}

/**
 * Registra un evento de auditoria; un fallo aqui nunca tumba la operacion.
 *
 * `message` es la frase legible, redactada en el instante del evento (immutable).
 * Si el caller no la provee, se construye con el redactor del event_type
 * resolviendo el nombre del actor y, cuando hace falta, el del curso.
 */
async function audit({ userId, groupId, eventType, target, metadata, message, actorRole, ip, userAgent }) {
  try {
    let finalMessage = message
    if (!finalMessage) {
      const [actor] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, role: true },
        }),
      ])
      const actorName = nombreDe({ name: actor?.name })
      if (!actorRole) actorRole = actor?.role ?? "unknown"

      const NEEDS_GROUP = ["auth_login", "student_registered"]
      let group = null
      if (groupId && NEEDS_GROUP.includes(eventType)) {
        group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } })
      }

      const builder = MESSAGE_BUILDERS[eventType]
      if (builder) {
        finalMessage = await builder({ actorName, target, metadata, group })
      } else {
        finalMessage = fallbackMessage(eventType, target)
      }
    }

    await prisma.auditEvent.create({
      data: {
        user_id: userId,
        actor_role: actorRole ?? "unknown",
        group_id: groupId ?? null,
        event_type: eventType,
        target: target ?? null,
        message: finalMessage,
        metadata: metadata ?? undefined,
        ip: ip ?? null,
        user_agent: userAgent ?? null,
      },
    })
  } catch (err) {
    logger.error({ err, eventType }, "Audit event not recorded")
  }
}

/** Extrae ip, user-agent y rol del actor desde la peticion Express (opcional). */
function requestMeta(req) {
  if (!req) return { ip: undefined, userAgent: undefined, actorRole: undefined }
  const forwarded = req.headers?.["x-forwarded-for"]
  const ip = forwarded
    ? String(forwarded).split(",")[0].trim()
    : req.ip || req.socket?.remoteAddress || undefined
  return {
    ip: ip ?? undefined,
    userAgent: req.headers?.["user-agent"] ?? undefined,
    actorRole: req.user?.role,
  }
}

module.exports = { audit, requestMeta }
