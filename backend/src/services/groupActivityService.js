const { randomUUID } = require("crypto")
const prisma = require("../../prisma/client")
const logger = require("../lib/logger")
const { AppError, NotFoundError } = require("../lib/errors")
const accessService = require("./accessService")
const checkCatalog = require("./checkCatalogService")
const { activityInputSchema, serializeGroupActivity } = require("../dtos/activityDtos")
const { parseOrThrow } = require("../dtos/common")
const { audit } = require("./auditService")

/** Normaliza la modalidad que manda el frontend ("atomic") a la de la base. */
function normalizeEvaluationType(value) {
  return value === "atomic" ? "automatic" : value
}

/**
 * La carpeta de trabajo de una actividad: nace del titulo para que sea legible
 * y del id para que sea unica (dos actividades con el mismo titulo no chocan).
 * El docente nunca la escribe; sus aserciones usan rutas relativas a ella.
 */
function generateWorkdir(title, id) {
  const slug =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 20) || "actividad"
  return `${slug}-${id.replace(/-/g, "").slice(0, 8)}`
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
 * La forma (titulo, instrucciones, politica, tema) la valida zod en
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

  const gradingPolicy = parsed.gradingPolicy

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

  return { title, instructions, maxScore, gradingPolicy, evaluationType, dueAt, topicNumber, checks }
}

/**
 * Crea una actividad propia del docente dentro de su grupo (RF-GRP-03).
 *
 * Nace con su definicion (source=teacher: es del docente, no aparece en el
 * banco) y su publicacion (GroupActivity con el snapshot de lo publicado:
 * titulo, instrucciones, modalidad, puntaje y aserciones. Si la definicion
 * cambiara, lo publicado no cambia: RF-GRP-11).
 *
 * La creacion es a la vez publicacion: queda habilitada al instante. El limite
 * de intentos y la configuracion de taller/quiz se agregan en una fase
 * posterior; aqui quedan sus valores por defecto (ilimitado, workshop,
 * best_score).
 */
async function createGroupActivity({ groupId, teacherUserId, role, input }) {
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const { title, instructions, maxScore, gradingPolicy, evaluationType, dueAt, topicNumber, checks } =
    validateActivityInput(input ?? {})

  const activity = await prisma.activityDefinition.create({
    data: {
      title,
      instructions,
      topic_number: Number.isInteger(topicNumber) ? topicNumber : null,
      difficulty: "basic",
      source: "teacher",
      evaluation_type: evaluationType,
      checks: { create: checks },
    },
    select: { id: true, topic_number: true, difficulty: true },
  })

  const workdir = generateWorkdir(title, activity.id)
  const groupActivity = await prisma.groupActivity.create({
    data: {
      group_id: group.id,
      activity_definition_id: activity.id,
      title,
      instructions,
      workdir,
      evaluation_type: evaluationType,
      checks,
      max_score: maxScore,
      grading_policy: gradingPolicy,
      required: true,
      enabled: true,
      due_at: dueAt,
    },
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

  const { title, instructions, maxScore, gradingPolicy, evaluationType, dueAt, topicNumber, checks } =
    validateActivityInput(body)

  // La definicion del docente es 1:1 con la publicacion: se mantiene en
  // sincronia para que el listado y el detalle sigan mostrando lo mismo.
  if (ga.definition) {
    await prisma.activityDefinition.update({
      where: { id: ga.definition.id },
      data: {
        title,
        instructions,
        topic_number: Number.isInteger(topicNumber) ? topicNumber : null,
        evaluation_type: evaluationType,
      },
    })
  }

  const updated = await prisma.groupActivity.update({
    where: { id: ga.id },
    data: {
      title,
      instructions,
      evaluation_type: evaluationType,
      checks,
      grading_policy: gradingPolicy,
      due_at: dueAt,
    },
    include: { definition: { select: { topic_number: true, difficulty: true } } },
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

module.exports = {
  createGroupActivity,
  updateGroupActivity,
  listGroupActivities,
  getGroupActivity,
}
