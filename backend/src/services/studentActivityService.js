const prisma = require("../../prisma/client")
const sshClient = require("./sshService")
const logger = require("../lib/logger")
const { AppError, NotFoundError, AuthorizationError } = require("../lib/errors")
const linuxAccountService = require("./linuxAccountService")
const accessService = require("./accessService")
const lessonEvaluatorService = require("./lessonEvaluatorService")
const attemptService = require("./attemptService")
const { audit } = require("./auditService")

const { personalize, CHECKER, EVAL_TIMEOUT_MS } = lessonEvaluatorService

/**
 * Resuelve las rutas de las aserciones contra la carpeta de trabajo: las
 * relativas se anteponen `actividades/<workdir>/`; las absolutas se respetan
 * (las comprobaciones del temario backfilled las usan).
 */
function resolveRuta(params, workdir) {
  const salida = {}
  for (const [clave, valor] of Object.entries(params ?? {})) {
    salida[clave] =
      clave === "ruta" && typeof valor === "string" && valor.trim() && !valor.startsWith("/")
        ? `actividades/${workdir}/${valor}`
        : valor
  }
  return salida
}

/**
 * El grupo de laboratorio del estudiante (su matricula activa) y sus
 * actividades de curso, para la vista "Mi Grupo". El estudiante tiene un solo
 * grupo activo; si no tiene ninguno, `group` es null.
 */
async function listMine(studentUserId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentUserId, status: "active", group: { archived: false } },
    include: { group: { include: { teacher: { select: { name: true } } } } },
    orderBy: { enrolled_at: "asc" },
  })
  if (!enrollment) return { group: null, activities: [] }

  const rows = await prisma.groupActivity.findMany({
    where: { group_id: enrollment.group_id },
    include: {
      definition: { select: { topic_number: true } },
      attempts: {
        where: { student_id: studentUserId },
        orderBy: { created_at: "desc" },
        take: 1,
        select: { passed: true, score: true },
      },
    },
    orderBy: { created_at: "desc" },
  })

  return {
    group: {
      id: enrollment.group.id,
      name: enrollment.group.name,
      description: enrollment.group.description ?? "",
      teacherName: enrollment.group.teacher?.name ?? "",
    },
    activities: rows.map((ga) => ({
      id: ga.id,
      title: ga.title,
      description: ga.instructions ?? "",
      topicNumber: ga.definition?.topic_number ?? 0,
      checksCount: (ga.checks ?? []).length,
      passed: ga.attempts[0]?.passed ?? false,
      lastScore: ga.attempts[0]?.score ?? null,
    })),
  }
}

/** Detalle que ve el estudiante: sin los criterios (ocultos hasta aprobar). */
async function getForStudent(studentUserId, groupActivityId) {
  const ga = await prisma.groupActivity.findUnique({
    where: { id: groupActivityId },
    select: { id: true, group_id: true, title: true, instructions: true, workdir: true, due_at: true, evaluation_type: true, max_score: true, checks: true },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")
  if (!(await accessService.hasEnrollmentInGroup(studentUserId, ga.group_id))) {
    throw new AuthorizationError("No estás inscrito en el curso de esta actividad")
  }

  const lastAttempt = await prisma.activityAttempt.findFirst({
    where: { group_activity_id: ga.id, student_id: studentUserId },
    orderBy: { created_at: "desc" },
    select: { passed: true, score: true },
  })

  return {
    id: ga.id,
    title: ga.title,
    instructions: ga.instructions ?? "",
    workdir: ga.workdir,
    dueAt: ga.due_at?.toISOString() ?? null,
    evaluationType: ga.evaluation_type === "manual" ? "manual" : "atomic",
    maxScore: ga.max_score,
    checksCount: (ga.checks ?? []).length,
    lastAttempt: lastAttempt ? { passed: lastAttempt.passed, score: lastAttempt.score } : null,
  }
}

/**
 * Evalua la actividad de curso contra el entorno del estudiante (RF-AUTO-02).
 *
 * Misma maquinaria que la linea base: el checker corre CON LA IDENTIDAD del
 * estudiante, los parametros viajan por stdin y las rutas relativas se
 * resuelven contra la carpeta de trabajo antes de mandar el payload.
 */
async function checkForStudent(studentUserId, groupActivityId) {
  const ga = await prisma.groupActivity.findUnique({
    where: { id: groupActivityId },
    select: {
      id: true,
      group_id: true,
      title: true,
      workdir: true,
      checks: true,
      evaluation_type: true,
      max_score: true,
      enabled: true,
      due_at: true,
      activity_definition_id: true,
    },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")
  if (!(await accessService.hasEnrollmentInGroup(studentUserId, ga.group_id))) {
    throw new AuthorizationError("No estás inscrito en el curso de esta actividad")
  }
  if (!ga.enabled) throw new AppError("La actividad está deshabilitada", 409, "CONFLICT")
  if (ga.due_at && ga.due_at <= new Date()) {
    throw new AppError("La actividad ya venció", 409, "CONFLICT")
  }
  if (ga.evaluation_type !== "automatic") {
    throw new AppError("Esta actividad se revisa manualmente", 409, "CONFLICT")
  }
  if (!ga.activity_definition_id) {
    throw new AppError("La actividad ya no está disponible", 409, "CONFLICT")
  }
  const checks = ga.checks ?? []
  if (checks.length === 0) {
    throw new AppError("La actividad no tiene aserciones que evaluar", 409, "CONFLICT")
  }

  const account = await linuxAccountService.cuentaDelEstudiante(studentUserId)

  const student = await prisma.user.findUnique({
    where: { id: studentUserId },
    select: { code: true, email: true },
  })

  const payload = JSON.stringify({
    checks: checks.map((c) => ({
      id: c.id,
      type: c.type,
      params: personalize(resolveRuta(c.params, ga.workdir), student),
    })),
  })

  const { code, stdout, stderr } = await sshClient.execCommand(
    `sudo -u ${account.linux_username} ${CHECKER}`,
    { stdin: payload, timeoutMs: EVAL_TIMEOUT_MS },
  )

  let parsed
  try {
    parsed = JSON.parse(stdout)
  } catch {
    logger.error({ code, stderr, groupActivityId: ga.id }, "Checker output was not JSON")
    throw new AppError("No se pudo evaluar tu entorno, inténtalo de nuevo", 502, "INTERNAL_ERROR")
  }

  const byId = new Map(parsed.results.map((r) => [r.id, r]))
  const results = checks.map((check) => {
    const outcome = byId.get(check.id)
    return {
      id: check.id,
      type: check.type,
      params: check.params,
      points: check.points,
      passed: outcome?.passed ?? false,
      detail: outcome?.detail ?? "No se pudo evaluar",
    }
  })

  const score = results.reduce((total, r) => total + (r.passed ? r.points : 0), 0)
  const passed = results.every((r) => r.passed)

  await attemptService.recordAttempt({
    activityDefinitionId: ga.activity_definition_id,
    groupActivityId: ga.id,
    studentUserId,
    passed,
    score,
    results,
  })

  audit({
    userId: studentUserId,
    groupId: ga.group_id,
    eventType: "activity_checked",
    target: ga.title,
    metadata: { groupActivityId: ga.id, passed, score },
  })

  logger.info({ groupActivityId: ga.id, username: account.linux_username, passed, score }, "Group activity checked")
  return { passed, score, maxScore: ga.max_score, results }
}

module.exports = { listMine, getForStudent, checkForStudent }
