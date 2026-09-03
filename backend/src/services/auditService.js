const prisma = require("../../prisma/client")
const logger = require("../lib/logger")

/**
 * Redactores de mensaje legible por tipo de evento. El nombre del actor NO se
 * incluye: la columna Usuario del listado ya lo identifica. Reciben `target`
 * (objeto sobre el que se actua) y `metadata` (detalles), y pueden resolver
 * datos extra (nombre del estudiante, del curso) con `prisma`. Devuelven la
 * frase en espanol que se guarda en la columna `message`.
 */
const MESSAGE_BUILDERS = {
  // --- Sesiones ---
  auth_login: ({ group }) => `Inició sesión${group ? ` en el curso ${group.name}` : ""}.`,
  auth_logout: () => "Cerró sesión.",

  // --- Actividades (entrega, validacion y gestion) ---
  activity_submitted: ({ target }) => `Entregó la actividad '${target}'.`,
  activity_checked: ({ target, metadata }) =>
    `Validó la actividad '${target}' (${metadata?.passed ? "aprobó" : "no aprobó"}, ${metadata?.score ?? 0} pts).`,
  activity_graded: async ({ target, metadata }) => {
    const studentName = await userNameOf(metadata?.studentId)
    return `Calificó la entrega de ${studentName} en '${target}' con ${metadata?.score ?? 0} pts.`
  },
  activity_created: ({ target }) => `Creó la actividad '${target}'.`,
  activity_updated: ({ target }) => `Actualizó la actividad '${target}'.`,
  activity_enabled: ({ target }) => `Habilitó la actividad '${target}'.`,
  activity_disabled: ({ target }) => `Deshabilitó la actividad '${target}'.`,
  activity_due_extended: ({ target }) =>
    `Extendió la fecha de entrega de la actividad '${target}'.`,

  // --- Administracion ---
  teacher_registered: ({ target }) => `Registró al docente '${target}'.`,
  teacher_toggled: ({ target, metadata }) =>
    `${metadata?.active ? "Activó" : "Desactivó"} al docente '${target}'.`,

  // --- Grupos ---
  group_created: ({ target }) => `Creó el curso '${target}'.`,
  group_finished: ({ target, metadata }) =>
    `Finalizó el curso '${target}' con ${metadata?.certificatesIssued ?? 0} certificado(s) emitido(s).`,
  group_archived: ({ target }) => `Archivó el curso '${target}'.`,
  group_deleted: ({ target }) => `Eliminó el curso '${target}'.`,

  // --- Matriculas ---
  student_registered: ({ target, group, metadata }) =>
    `Matriculó a '${metadata?.studentName ?? target}'${group ? ` en el curso ${group.name}` : ""}.`,
  csv_imported: ({ metadata }) =>
    `Importó ${metadata?.registered ?? 0} estudiante(s) vía CSV${metadata?.skipped ? ` (${metadata.skipped} omitidos)` : ""}.`,
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
 * resolviendo el rol del actor y, cuando hace falta, el del curso o estudiante.
 */
async function audit({ userId, groupId, eventType, target, metadata, message, actorRole, ip, userAgent }) {
  try {
    let finalMessage = message
    if (!finalMessage) {
      if (!actorRole) {
        const actor = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
        actorRole = actor?.role ?? "unknown"
      }

      const NEEDS_GROUP = ["auth_login", "student_registered"]
      let group = null
      if (groupId && NEEDS_GROUP.includes(eventType)) {
        group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } })
      }

      const builder = MESSAGE_BUILDERS[eventType]
      if (builder) {
        finalMessage = await builder({ target, metadata, group })
      } else {
        finalMessage = fallbackMessage(eventType, target)
      }
    }

    await prisma.auditEvent.create({
      data: {
        user_id: userId,
        user_role: actorRole ?? "admin",
        group_id: groupId ?? null,
        event_type: eventType,
        message: finalMessage,
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
