const prisma = require("../../prisma/client")
const sshClient = require("./sshClient")
const logger = require("../lib/logger")
const { AppError, NotFoundError, AuthorizationError } = require("../lib/errors")
const enrollmentService = require("./enrollmentService")

/** El evaluador vive dentro de la imagen del entorno, en ruta fija. */
const CHECKER = "/usr/local/lib/linuxlab/checker.py"
const SETUP = "/usr/local/lib/linuxlab/setup.py"

/** Nombres de cuenta que puede haber en el contenedor. */
const USERNAME = /^[a-z_][a-z0-9_-]{0,31}$/

const EVAL_TIMEOUT_MS = 20000

/**
 * Datos del estudiante que el contenedor no tiene forma de conocer.
 *
 * `$usuario` lo resuelve el checker por dentro, leyendo la cuenta con la que
 * corre, y por eso no se puede falsear. El codigo y el correo solo viven en la
 * base, asi que se sustituyen aqui: siguen viniendo del servidor, nunca de la
 * peticion, que es lo que importa.
 */
function personalize(params, student) {
  const valores = { $codigo: student.code, $correo: student.email }
  const salida = {}
  for (const [clave, valor] of Object.entries(params ?? {})) {
    salida[clave] =
      typeof valor === "string"
        ? Object.entries(valores).reduce(
            (texto, [token, real]) => texto.split(token).join(real),
            valor,
          )
        : valor
  }
  return salida
}

/** Los tokens que hay que poder resolver antes de evaluar. */
const NEEDS_CODE = /\$codigo\b/

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
  hasSetup: Boolean(activity.setup),
  checks: activity.checks.map(publicCheck),
})

/**
 * El banco que ve el docente. Se sirve con la forma que espera su tabla, no con
 * la del estudiante: ahi mandan el titulo, el tema y la dificultad, y `uses`
 * dice cuantos estudiantes distintos la han intentado.
 */
async function listBank() {
  const activities = await prisma.activity.findMany({
    where: { kind: "activity" },
    include: {
      checks: { orderBy: { position: "asc" } },
      _count: { select: { attempts: true } },
    },
    orderBy: [{ topic_number: "asc" }, { title: "asc" }],
  })

  return activities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    topicNumber: activity.topic_number,
    source: "bank",
    difficulty: activity.difficulty,
    instructions: activity.instructions ?? "",
    maxScore: activity.max_score,
    required: false,
    evaluationType: "atomic",
    checks: activity.checks.map(publicCheck),
    uses: activity._count.attempts,
  }))
}

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

  const account = await cuentaDelEstudiante(studentUserId)

  const student = await prisma.user.findUnique({
    where: { id: studentUserId },
    select: { code: true, email: true },
  })

  // Sin codigo no se puede evaluar una actividad que lo pide, y el mensaje tiene
  // que decir eso y no fallar con una ruta rara mas adelante.
  const usesCode = activity.checks.some((c) =>
    Object.values(c.params ?? {}).some((v) => typeof v === "string" && NEEDS_CODE.test(v)),
  )
  if (usesCode && !student?.code) {
    throw new AppError("Tu perfil no tiene código estudiantil registrado", 409, "CONFLICT")
  }

  const payload = JSON.stringify({
    checks: activity.checks.map((c) => ({
      id: c.id,
      type: c.type,
      params: personalize(c.params, student),
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

/**
 * Comprobaciones comunes antes de tocar el entorno de un estudiante.
 *
 * Se hacen en el mismo orden y con los mismos mensajes tanto para evaluar como
 * para preparar el directorio de trabajo: si la matricula no vale para una cosa,
 * tampoco vale para la otra.
 */
async function cuentaDelEstudiante(studentUserId) {
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
  return account
}

/**
 * Rehace el directorio de trabajo de una actividad desde cero.
 *
 * Es lo que hay detrás del botón de recargar: lo que hubiera se descarta entero
 * y el árbol vuelve a su estado inicial. Eso es lo que permite plantear
 * actividades donde el estudiante borre sin miedo a quedarse sin nada.
 */
async function resetSandbox({ slug, studentUserId, force = false }) {
  const activity = await prisma.activity.findUnique({
    where: { slug },
    select: { slug: true, setup: true },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")
  if (!activity.setup) {
    throw new AppError("Esta actividad no tiene archivos que preparar", 409, "CONFLICT")
  }

  const account = await cuentaDelEstudiante(studentUserId)
  const payload = JSON.stringify({ ...activity.setup, slug: activity.slug, force })

  const { stdout, stderr, code } = await sshClient.execCommand(
    `sudo -u ${account.linux_username} ${SETUP}`,
    { stdin: payload, timeoutMs: EVAL_TIMEOUT_MS },
  )

  let parsed
  try {
    parsed = JSON.parse(stdout)
  } catch {
    logger.error({ code, stderr, slug }, "Setup output was not JSON")
    throw new AppError("No se pudo preparar la actividad, inténtalo de nuevo", 502, "INTERNAL_ERROR")
  }
  if (!parsed.ok) {
    logger.error({ slug, error: parsed.error }, "Activity setup rejected")
    throw new AppError(parsed.error || "No se pudo preparar la actividad", 409, "CONFLICT")
  }

  logger.info(
    { slug, username: account.linux_username, creados: parsed.creados, force },
    "Sandbox ready",
  )
  return { root: parsed.root, creados: parsed.creados, yaEstaba: Boolean(parsed.yaEstaba) }
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

module.exports = { listBank, getBySlug, evaluate, resetSandbox, lastAttempt, passedSlugs }
