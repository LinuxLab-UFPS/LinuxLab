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

function normalizeEvaluationType(value) {
  return value === "atomic" ? "automatic" : value
}

function generateWorkdir(activityType, activityNumber) {
  const prefix = activityType === "quiz" ? "Q" : "T"
  return `${prefix}-${String(activityNumber).padStart(4, "0")}`
}

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

function validateActivityInput(body) {
  const parsed = parseOrThrow(activityInputSchema, body ?? {})

  const title = parsed.title
  const instructions = parsed.instructions || null
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

  const topicNumber = parsed.topicNumber !== undefined ? Number(parsed.topicNumber) || null : null

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

  const checks = buildChecks(parsed.checks, { evaluationType, maxScore })

  return { title, instructions, maxScore, activityType, attemptLimit, evaluationType, dueAt, checks, topicNumber }
}

async function createGroupActivity({ groupId, teacherUserId, role, input }) {
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const { title, instructions, maxScore, activityType, attemptLimit, evaluationType, dueAt, checks, topicNumber } =
    validateActivityInput(input ?? {})

  const groupActivity = await runInTransaction(async (tx) => {
    const groupActivityId = randomUUID()
    const created = await tx.groupActivity.create({
      data: {
        id: groupActivityId,
        group_id: group.id,
        title,
        instructions,
        activity_type: activityType,
        evaluation_type: evaluationType,
        max_score: maxScore,
        checks,
        attempt_limit: attemptLimit,
        topic_number: topicNumber,
        required: true,
        enabled: true,
        due_at: dueAt,
        workdir: "pending",
      },
    })
    return tx.groupActivity.update({
      where: { id: created.id },
      data: { workdir: generateWorkdir(activityType, created.activity_number) },
    })
  })

  audit({
    userId: teacherUserId,
    groupId: group.id,
    eventType: "activity_created",
    target: title,
    metadata: { groupActivityId: groupActivity.id },
  })

  logger.info({ groupId, teacherUserId, activityId: groupActivity.id }, "Group activity created")
  return serializeGroupActivity(groupActivity)
}

async function updateGroupActivity({ groupId, activityId, teacherUserId, role, input }) {
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: group.id },
    include: { _count: { select: { submissions: true } } },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")

  if (ga._count.submissions > 0) {
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

  const { title, instructions, maxScore, activityType, attemptLimit, evaluationType, dueAt, checks, topicNumber } =
    validateActivityInput(body)

  const updated = await prisma.groupActivity.update({
    where: { id: ga.id },
    data: {
      title,
      instructions,
      activity_type: activityType,
      evaluation_type: evaluationType,
      checks,
      attempt_limit: attemptLimit,
      topic_number: topicNumber,
      due_at: dueAt,
    },
  })

  audit({
    userId: teacherUserId,
    groupId: group.id,
    eventType: "activity_updated",
    target: title,
    metadata: { groupActivityId: ga.id },
  })

  logger.info({ groupId, teacherUserId, activityId: ga.id }, "Group activity updated")
  return serializeGroupActivity(updated)
}

async function listGroupActivities({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const rows = await prisma.groupActivity.findMany({
    where: { group_id: groupId },
    orderBy: { created_at: "desc" },
  })
  return rows.map(serializeGroupActivity)
}

async function getGroupActivity({ groupId, activityId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")
  return serializeGroupActivity(ga)
}

async function setGroupActivityEnabled({ groupId, activityId, teacherUserId, role, enabled }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")
  if (ga.enabled === enabled) return serializeGroupActivity(ga)

  const updated = await runInTransaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "GroupActivity" WHERE id = ${ga.id} FOR UPDATE`

    const row = await tx.groupActivity.findFirst({
      where: { id: ga.id },
      select: { _count: { select: { submissions: true } } },
    })
    if (!row) throw new NotFoundError("Actividad no encontrada")
    if (!enabled && row._count.submissions > 0) {
      throw new AppError(
        "La actividad ya tiene intentos o entregas; no se puede deshabilitar",
        409,
        "CONFLICT",
      )
    }

    return tx.groupActivity.update({
      where: { id: ga.id },
      data: { enabled },
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
  return serializeGroupActivity(updated)
}

async function extendGroupActivityDueDate({ groupId, activityId, teacherUserId, role, dueDate }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
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
    return serializeGroupActivity(ga)
  }

  const updated = await runInTransaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "GroupActivity" WHERE id = ${ga.id} FOR UPDATE`
    return tx.groupActivity.update({
      where: { id: ga.id },
      data: { due_at: newDueAt },
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
  return serializeGroupActivity(updated)
}

async function getActivitySubmissions({ groupId, activityId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
    select: { id: true },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")

  const grouped = await prisma.groupSubmission.groupBy({
    by: ["enrollment_id"],
    where: { group_activity_id: ga.id },
    _count: { id: true },
    _max: { created_at: true },
  })

  if (grouped.length === 0) return []

  const enrollmentIds = grouped.map((g) => g.enrollment_id)
  const enrollments = await prisma.enrollment.findMany({
    where: { id: { in: enrollmentIds } },
    include: { student: { include: { user: true } } },
  })
  const enrollmentMap = new Map(enrollments.map((e) => [e.id, e]))

  const submissions = await Promise.all(
    grouped.map(async (g) => {
      const submissions = await prisma.groupSubmission.findMany({
        where: { group_activity_id: ga.id, enrollment_id: g.enrollment_id },
        orderBy: { created_at: "desc" },
        include: { autoDetail: { select: { auto_results: true } } },
      })
      const attempts = submissions.filter((s) => s.autoDetail !== null)
      const enrollment = enrollmentMap.get(g.enrollment_id)
      const student = enrollment?.student?.user
      return {
        studentId: student?.id ?? null,
        studentName: student?.name ?? "—",
        studentEmail: student?.email ?? "—",
        studentCode: enrollment?.student?.code ?? null,
        attemptsCount: g._count.id,
        lastAttemptDate: g._max.created_at?.toISOString() ?? null,
        finalScore: finalScore(attempts.map((a) => ({ score: a.score, created_at: a.created_at }))),
        submissionId: null,
      }
    }),
  )

  return submissions
}

async function getManualSubmissions({ groupId, activityId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
    select: { id: true, max_score: true },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")

  const subs = await prisma.groupSubmission.findMany({
    where: { group_activity_id: ga.id },
    orderBy: { created_at: "desc" },
    include: {
      enrollment: { include: { student: { include: { user: true } } } },
      manualDetail: { select: { evidence: true } },
    },
  })

  return subs.map((s) => ({
    submissionId: s.id,
    studentId: s.enrollment?.student?.user?.id ?? null,
    studentName: s.enrollment?.student?.user?.name ?? "—",
    studentEmail: s.enrollment?.student?.user?.email ?? "—",
    studentCode: s.enrollment?.student?.code ?? null,
    status: s.status,
    score: s.score,
    submittedAt: s.created_at.toISOString(),
    files: Number(s.manualDetail?.evidence?.files) || 0,
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
