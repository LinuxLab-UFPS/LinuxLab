const { randomUUID } = require("crypto")
const prisma = require("../../prisma/client")
const logger = require("../lib/logger")
const { AppError, NotFoundError } = require("../lib/errors")
const accessService = require("./accessService")
const checkCatalog = require("./checkCatalogService")
const { activityInputSchema, serializeGroupActivity } = require("../dtos/activityDtos")
const { parseOrThrow } = require("../dtos/common")
const { audit } = require("./auditService")
const { runInTransaction } = require("../lib/transaction")
const { finalScore } = require("../utils/finalScore")

/** Normaliza la modalidad que manda el frontend ("atomic") a la de la base. */
function normalizeEvaluationType(value) {
  return value === "atomic" ? "automatic" : value
}

/**
 * La carpeta de trabajo de una actividad: nace del titulo para que sea legible
 * y del id para que sea unica (dos actividades con el mismo titulo no chocan).
 * El docente nunca la escribe; sus aserciones usan rutas relativas a ella.
 */
function generateWorkdir(activityType, activityNumber) {
  const prefix = activityType === "quiz" ? "Q" : "T"
  return `${prefix}-${String(activityNumber).padStart(4, "0")}`
}

/**
 * Valida las aserciones de una actividad automatica y devuelve su snapshot con
 * ids generados en el servidor (los del cliente no se aceptan). Las posiciones
 * salen del orden de llegada y el puntaje repartido no puede superar el maximo.
 *
 * Las rutas son SIEMPRE relativas a la carpeta de trabajo de la actividad:
 * ni absolutas ni con `..`. El backend las resuelve contra la carpeta al
 * evaluar; aqui solo se valida la forma.
 */
function buildChecks(list, { evaluationType, maxScore }) {
  if (evaluationType === "manual") return []

  if (!Array.isArray(list) || list.length === 0) {
    throw new AppError("Una actividad automática necesita al menos una aserción", 400, "VALIDATION_ERROR")
  }

  const checks = []
  let total = 0
  for (let i = 0; i < list.length; i++) {
    const check = list[i] ?? {}
    if (!checkCatalog.isKnown(check.type)) {
      throw new AppError(`El tipo de aserción "${check.type}" no existe en el catálogo`, 400, "VALIDATION_ERROR")
    }
    const params = check.params ?? {}
    const error = checkCatalog.validatorOf(check.type)(params)
    if (error) {
      throw new AppError(`Aserción ${i + 1} (${check.type}): ${error}`, 400, "VALIDATION_ERROR")
    }
    const ruta = params.ruta
    if (typeof ruta === "string" && ruta.trim() && (ruta.startsWith("/") || ruta.split("/").includes(".."))) {
      throw new AppError(
        `Aserción ${i + 1} (${check.type}): la ruta debe ser relativa a la carpeta de trabajo de la actividad`,
        400,
        "VALIDATION_ERROR",
      )
    }
    const points = Number(check.points)
    if (!Number.isInteger(points) || points < 0) {
      throw new AppError(
        `Aserción ${i + 1} (${check.type}): los puntos deben ser un entero no negativo`,
        400,
        "VALIDATION_ERROR",
      )
    }
    total += points
    checks.push({ id: randomUUID(), type: check.type, params, points, position: i })
  }

  if (total > maxScore) {
    throw new AppError(
      `El puntaje repartido (${total}) supera el de la actividad (${maxScore})`,
      400,
      "VALIDATION_ERROR",
    )
  }
  return checks
}

/**
 * Validacion comun de la configuracion de una actividad de grupo, usada por la
 * creacion y la edicion. Devuelve los valores ya validados y normalizados.
 *
 * La forma (titulo, instrucciones, tema) la valida zod en
 * activityInputSchema; las aserciones dependen del catalogo y el puntaje
 * repartido, y las valida buildChecks.
 */
function validateActivityInput(body) {
  const parsed = parseOrThrow(activityInputSchema, body ?? {})

  const title = parsed.title
  const instructions = parsed.instructions || null

  // Toda actividad vale 100 puntos (escala 0-100). No se lee del cuerpo: lo
  // unico que se valida es que el puntaje repartido entre las aserciones no
  // supere ese valor (ver buildChecks).
  const maxScore = 100

  const activityType = parsed.activityType
  const attemptLimit = parsed.attemptLimit ?? null
  if (activityType === "workshop" && attemptLimit !== null) {
    throw new AppError("Las actividades tipo taller no tienen límite de intentos", 400, "VALIDATION_ERROR")
  }
  if (attemptLimit !== null && (!Number.isInteger(attemptLimit) || attemptLimit < 1)) {
    throw new AppError("El límite de intentos debe ser un entero positivo", 400, "VALIDATION_ERROR")
  }

  const evaluationType = normalizeEvaluationType(parsed.evaluationType ?? "automatic")
  if (!["automatic", "manual"].includes(evaluationType)) {
    throw new AppError("La modalidad de evaluación no es válida", 400, "VALIDATION_ERROR")
  }

  let dueAt = null
  if (parsed.dueDate) {
    dueAt = new Date(parsed.dueDate)
    if (Number.isNaN(dueAt.getTime())) {
      throw new AppError("La fecha de cierre no es válida", 400, "VALIDATION_ERROR")
    }
    if (dueAt <= new Date()) {
      throw new AppError("La fecha de cierre debe ser posterior a la fecha actual", 400, "VALIDATION_ERROR")
    }
  }

  const topicNumber = Number(parsed.topicNumber)
  const checks = buildChecks(parsed.checks, { evaluationType, maxScore })

  return { title, instructions, maxScore, activityType, attemptLimit, evaluationType, dueAt, topicNumber, checks }
}

/**
 * Crea una actividad propia del docente dentro de su grupo (RF-GRP-03).
 *
 * Nace con su definicion (source=teacher: es del docente, no aparece en el
 * banco) y su publicacion (GroupActivity con el snapshot de lo publicado:
 * titulo, instrucciones, modalidad, puntaje y aserciones. Si la definicion
 * cambiara, lo publicado no cambia: RF-GRP-11).
 *
 * La creacion es a la vez publicacion: queda habilitada al instante. La
 * modalidad de taller/quiz se agrega en una fase posterior; aqui queda su
 * valor por defecto (workshop).
 */
async function createGroupActivity({ groupId, teacherUserId, role, input }) {
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const { title, instructions, maxScore, activityType, attemptLimit, evaluationType, dueAt, topicNumber, checks } =
    validateActivityInput(input ?? {})

  // La definicion y la publicacion nacen juntas: si una de las dos falla, la
  // transaccion deshace la otra (no pueden quedar huerfanas).
  const { activity, groupActivity } = await runInTransaction(async (tx) => {
    const activity = await tx.activityDefinition.create({
      data: {
        title,
        instructions,
        topic_number: Number.isInteger(topicNumber) ? topicNumber : null,
        difficulty: "basic",
        kind: "activity",
        activity_type: activityType,
        evaluation_type: evaluationType,
        max_score: maxScore,
        source: "teacher",
        active: true,
        created_by: teacherUserId,
      },
    })

    // La carpeta de trabajo nace del id de la publicacion: se genera antes de
    // crearla para poder guardarla en el mismo registro.
    const groupActivityId = randomUUID()
    const createdGroupActivity = await tx.groupActivity.create({
      data: {
        id: groupActivityId,
        group_id: group.id,
        activity_definition_id: activity.id,
        title,
        instructions,
        activity_type: activityType,
        evaluation_type: evaluationType,
        max_score: maxScore,
        checks,
        attempt_limit: attemptLimit,
        required: true,
        enabled: true,
        due_at: dueAt,
        workdir: "pending",
      },
    })
    const groupActivity = await tx.groupActivity.update({
      where: { id: createdGroupActivity.id },
      data: { workdir: generateWorkdir(activityType, createdGroupActivity.activity_number) },
    })
    return { activity, groupActivity }
  })

  audit({
    userId: teacherUserId,
    groupId: group.id,
    eventType: "activity_created",
    target: title,
    metadata: { groupActivityId: groupActivity.id, definitionId: activity.id },
  })

  logger.info({ groupId, teacherUserId, activityId: groupActivity.id }, "Group activity created")
  return serializeGroupActivity(groupActivity, activity)
}

/**
 * Edita la configuracion publicada de una actividad de grupo.
 *
 * La carpeta de trabajo, la puntuacion (siempre 100) y la obligatoriedad
 * (siempre true) no se editan. Y la actividad con intentos o entregas no se
 * toca: cambiar las condiciones con historial seria cambiar las reglas a mitad
 * de partida (la politica queda congelada tras el primer intento).
 */
async function updateGroupActivity({ groupId, activityId, teacherUserId, role, input }) {
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: group.id },
    include: {
      _count: { select: { attempts: true, submissions: true } },
      definition: { select: { id: true } },
    },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")

  if (ga._count.attempts > 0 || ga._count.submissions > 0) {
    throw new AppError("La actividad ya tiene intentos o entregas; no se puede editar", 409, "CONFLICT")
  }

  const body = input ?? {}
  if (body.workdir !== undefined && body.workdir !== ga.workdir) {
    throw new AppError("La carpeta de trabajo no se puede cambiar", 400, "VALIDATION_ERROR")
  }
  if (body.maxScore !== undefined && Number(body.maxScore) !== 100) {
    throw new AppError("La puntuación máxima siempre es 100", 400, "VALIDATION_ERROR")
  }
  if (body.required !== undefined && body.required !== true) {
    throw new AppError("Toda actividad es obligatoria", 400, "VALIDATION_ERROR")
  }

  const { title, instructions, maxScore, activityType, attemptLimit, evaluationType, dueAt, topicNumber, checks } =
    validateActivityInput(body)

  // La definicion del docente es 1:1 con la publicacion: se mantiene en
  // sincronia para que el listado y el detalle sigan mostrando lo mismo. Los
  // dos updates son atomicos: si el segundo falla, el primero se deshace.
  const updated = await runInTransaction(async (tx) => {
    if (ga.definition) {
      await tx.activityDefinition.update({
        where: { id: ga.definition.id },
        data: {
          title,
          instructions,
          topic_number: Number.isInteger(topicNumber) ? topicNumber : null,
          activity_type: activityType,
          evaluation_type: evaluationType,
        },
      })
    }

    return tx.groupActivity.update({
      where: { id: ga.id },
      data: {
        title,
        instructions,
        activity_type: activityType,
        evaluation_type: evaluationType,
        checks,
        attempt_limit: attemptLimit,
        due_at: dueAt,
      },
      include: { definition: { select: { topic_number: true, difficulty: true } } },
    })
  })

  audit({
    userId: teacherUserId,
    groupId: group.id,
    eventType: "activity_updated",
    target: title,
    metadata: { groupActivityId: ga.id },
  })

  logger.info({ groupId, teacherUserId, activityId: ga.id }, "Group activity updated")
  return serializeGroupActivity(updated, updated.definition)
}

/** Las actividades publicadas en el grupo, para la pestaña de su curso. */
async function listGroupActivities({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const rows = await prisma.groupActivity.findMany({
    where: { group_id: groupId },
    include: { definition: { select: { topic_number: true, difficulty: true } } },
    orderBy: { created_at: "desc" },
  })
  return rows.map((ga) => serializeGroupActivity(ga, ga.definition))
}

async function getGroupActivity({ groupId, activityId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
    include: { definition: { select: { topic_number: true, difficulty: true } } },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")
  return serializeGroupActivity(ga, ga.definition)
}

/**
 * Habilita o deshabilita una actividad publicada (RF-GRP-10). Deshabilitar no
 * borra historial y no toca la politica: solo deja de aceptar intentos y
 * entregas al instante (el check del estudiante valida `enabled`). Idempotente.
 *
 * Deshabilitar con historial no se permite: si ya hay intentos o entregas, la
 * actividad queda habilitada para siempre (cambiar la regla a mitad de partida
 * seria injusto). La validacion bloquea la fila con FOR UPDATE para que un
 * check concurrente no pueda registrar el primer intento entre la revision y
 * la escritura.
 */
async function setGroupActivityEnabled({ groupId, activityId, teacherUserId, role, enabled }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
    include: { definition: { select: { topic_number: true, difficulty: true } } },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")
  if (ga.enabled === enabled) return serializeGroupActivity(ga, ga.definition)

  const updated = await runInTransaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM group_activities WHERE id = ${ga.id} FOR UPDATE`

    const row = await tx.groupActivity.findFirst({
      where: { id: ga.id },
      select: { _count: { select: { attempts: true, submissions: true } } },
    })
    if (!row) throw new NotFoundError("Actividad no encontrada")
    if (!enabled && row._count.attempts + row._count.submissions > 0) {
      throw new AppError(
        "La actividad ya tiene intentos o entregas; no se puede deshabilitar",
        409,
        "CONFLICT",
      )
    }

    return tx.groupActivity.update({
      where: { id: ga.id },
      data: { enabled },
      include: { definition: { select: { topic_number: true, difficulty: true } } },
    })
  })

  audit({
    userId: teacherUserId,
    groupId,
    eventType: enabled ? "activity_enabled" : "activity_disabled",
    target: updated.title,
    metadata: { groupActivityId: ga.id },
  })

  logger.info({ groupId, teacherUserId, activityId: ga.id, enabled }, "Group activity enabled state changed")
  return serializeGroupActivity(updated, updated.definition)
}

/**
 * Extiende la fecha de cierre de una actividad publicada.
 *
 * A diferencia de la edicion completa (que se bloquea con historial), extender
 * el cierre solo relaja la regla: no cambia condiciones a mitad de partida, asi
 * que se permite aunque ya haya intentos o entregas. Solo se permite mover la
 * fecha hacia adelante; acortarla o quitarla sigue pasando por la edicion
 * completa (que requiere no tener historial).
 *
 * La fila se bloquea con FOR UPDATE para que un check concurrente no pueda
 * registrar el primer intento entre la revision y la escritura.
 */
async function extendGroupActivityDueDate({ groupId, activityId, teacherUserId, role, dueDate }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
    include: { definition: { select: { topic_number: true, difficulty: true } } },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")

  const newDueAt = new Date(dueDate)
  if (Number.isNaN(newDueAt.getTime())) {
    throw new AppError("La fecha de cierre no es válida", 400, "VALIDATION_ERROR")
  }
  if (ga.due_at && newDueAt <= ga.due_at) {
    throw new AppError("La nueva fecha debe ser posterior a la fecha de cierre actual", 400, "VALIDATION_ERROR")
  }
  if (newDueAt <= new Date()) {
    throw new AppError("La fecha de cierre debe ser posterior a la fecha actual", 400, "VALIDATION_ERROR")
  }
  if (ga.due_at && newDueAt.getTime() === ga.due_at.getTime()) {
    return serializeGroupActivity(ga, ga.definition)
  }

  const updated = await runInTransaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM group_activities WHERE id = ${ga.id} FOR UPDATE`
    return tx.groupActivity.update({
      where: { id: ga.id },
      data: { due_at: newDueAt },
      include: { definition: { select: { topic_number: true, difficulty: true } } },
    })
  })

  audit({
    userId: teacherUserId,
    groupId,
    eventType: "activity_due_extended",
    target: updated.title,
    metadata: { groupActivityId: ga.id, dueAt: newDueAt.toISOString() },
  })

  logger.info({ groupId, teacherUserId, activityId: ga.id }, "Group activity due date extended")
  return serializeGroupActivity(updated, updated.definition)
}

/**
 * Intentos por estudiante para una actividad de grupo: la tabla de entregas
 * que ve el docente en el detalle de la actividad.
 */
async function getActivitySubmissions({ groupId, activityId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
    select: { id: true },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")

  const grouped = await prisma.activityAttempt.groupBy({
    by: ["student_id"],
    where: { group_activity_id: ga.id },
    _count: { id: true },
    _max: { created_at: true },
  })

  if (grouped.length === 0) return []

  const studentIds = grouped.map((g) => g.student_id)
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, email: true, studentProfile: { select: { code: true } } },
  })
  const studentMap = new Map(students.map((s) => [s.id, s]))

  const submissions = await Promise.all(
    grouped.map(async (g) => {
      const attempts = await prisma.activityAttempt.findMany({
        where: { group_activity_id: ga.id, student_id: g.student_id },
        orderBy: { created_at: "desc" },
        select: { score: true, created_at: true },
      })
      const student = studentMap.get(g.student_id)
      return {
        studentId: g.student_id,
        studentName: student?.name ?? "—",
        studentEmail: student?.email ?? "—",
        studentCode: student?.studentProfile?.code ?? null,
        attemptsCount: g._count.id,
        lastAttemptDate: g._max.created_at?.toISOString() ?? null,
        finalScore: finalScore(attempts),
        submissionId: null,
      }
    }),
  )

  return submissions
}

/**
 * Entregas manuales para una actividad: la tabla de submissions del docente.
 */
async function getManualSubmissions({ groupId, activityId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
    select: { id: true, max_score: true },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")

  const subs = await prisma.activitySubmission.findMany({
    where: { group_activity_id: ga.id },
    orderBy: { submitted_at: "desc" },
    include: {
      student: {
        select: {
          user_id: true,
          code: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  return subs.map((s) => ({
    submissionId: s.id,
    studentId: s.student_id,
    studentName: s.student.user?.name ?? "—",
    studentEmail: s.student.user?.email ?? "—",
    studentCode: s.student.code,
    status: s.status,
    score: s.score,
    submittedAt: s.submitted_at.toISOString(),
    files: Number(s.evidence?.files) || 0,
  }))
}

module.exports = {
  createGroupActivity,
  updateGroupActivity,
  listGroupActivities,
  getGroupActivity,
  setGroupActivityEnabled,
  extendGroupActivityDueDate,
  getActivitySubmissions,
  getManualSubmissions,
}
