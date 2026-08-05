const prisma = require("../../prisma/client")
const sshClient = require("./sshClient")
const logger = require("../lib/logger")
const { AppError, NotFoundError, AuthorizationError } = require("../lib/errors")
const enrollmentService = require("./enrollmentService")

/** El evaluador vive dentro de la imagen del entorno, en ruta fija. */
const CHECKER = "/usr/local/lib/linuxlab/checker.py"

/** Nombres de cuenta que puede haber en el contenedor. */
const USERNAME = /^[a-z_][a-z0-9_-]{0,31}$/

const EVAL_TIMEOUT_MS = 20000

const publicCheck = (check) => ({
  id: check.id,
  type: check.type,
  params: check.params,
  points: check.points,
})

const serialize = (activity) => ({
  id: activity.id,
  slug: activity.slug,
  title: activity.title,
  instructions: activity.instructions,
  topicNumber: activity.topic_number,
  maxScore: activity.max_score,
  checks: activity.checks.map(publicCheck),
})

async function getBySlug(slug) {
  const activity = await prisma.activity.findUnique({
    where: { slug },
    include: { checks: { orderBy: { position: "asc" } } },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")
  return serialize(activity)
}

/**
 * Corre las aserciones de una actividad sobre el entorno del estudiante.
 *
 * Quien evalua es el checker de la imagen, ejecutado CON LA IDENTIDAD del
 * estudiante: asi lo que se mide es lo que el estudiante puede ver y hacer, no
 * lo que puede root. Los parametros del docente viajan por stdin como JSON y
 * nunca se interpolan en la linea de comandos; lo unico que se arma como texto
 * es el nombre de la cuenta, validado contra `USERNAME`.
 */
async function evaluate({ slug, studentUserId }) {
  const activity = await prisma.activity.findUnique({
    where: { slug },
    include: { checks: { orderBy: { position: "asc" } } },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")
  if (activity.checks.length === 0) {
    throw new AppError("La actividad no tiene aserciones que evaluar", 409, "CONFLICT")
  }

  if (!(await enrollmentService.hasActiveEnrollment(studentUserId))) {
    throw new AuthorizationError("No estás inscrito en ningún curso activo")
  }

  const account = await prisma.linuxAccount.findUnique({ where: { user_id: studentUserId } })
  if (!account?.linux_username) {
    throw new AppError("Todavía no tienes cuenta en el entorno", 409, "CONFLICT")
  }
  if (!account.linux_provisioned) {
    throw new AppError("Tu cuenta del entorno se está creando, intenta en un momento", 409, "CONFLICT")
  }
  if (!USERNAME.test(account.linux_username)) {
    throw new AppError("El nombre de tu cuenta no es válido", 500, "INTERNAL_ERROR")
  }

  const payload = JSON.stringify({
    checks: activity.checks.map((c) => ({ id: c.id, type: c.type, params: c.params })),
  })

  const { code, stdout, stderr } = await sshClient.execCommand(
    `sudo -u ${account.linux_username} ${CHECKER}`,
    { stdin: payload, timeoutMs: EVAL_TIMEOUT_MS },
  )

  let parsed
  try {
    parsed = JSON.parse(stdout)
  } catch {
    logger.error({ code, stderr, username: account.linux_username }, "Checker output was not JSON")
    throw new AppError("No se pudo evaluar tu entorno, inténtalo de nuevo", 502, "INTERNAL_ERROR")
  }

  const byId = new Map(parsed.results.map((r) => [r.id, r]))
  const results = activity.checks.map((check) => {
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

  await prisma.activityAttempt.create({
    data: {
      activity_id: activity.id,
      student_id: studentUserId,
      passed,
      score,
      results,
    },
  })

  logger.info({ slug, username: account.linux_username, passed, score }, "Activity evaluated")
  return { passed, score, maxScore: activity.max_score, results }
}

/** Los slugs que el estudiante ya aprobo, para marcar sus tarjetas. */
async function passedSlugs(studentUserId) {
  const attempts = await prisma.activityAttempt.findMany({
    where: { student_id: studentUserId, passed: true },
    select: { activity: { select: { slug: true } } },
    distinct: ["activity_id"],
  })
  return attempts.map((a) => a.activity.slug).filter(Boolean)
}

/** El ultimo intento del estudiante, para que la leccion abra con su estado. */
async function lastAttempt({ slug, studentUserId }) {
  const activity = await prisma.activity.findUnique({ where: { slug }, select: { id: true } })
  if (!activity) throw new NotFoundError("Actividad no encontrada")

  const attempt = await prisma.activityAttempt.findFirst({
    where: { activity_id: activity.id, student_id: studentUserId },
    orderBy: { created_at: "desc" },
  })
  if (!attempt) return null
  return {
    passed: attempt.passed,
    score: attempt.score,
    results: attempt.results,
    at: attempt.created_at,
  }
}

module.exports = { getBySlug, evaluate, lastAttempt, passedSlugs }
