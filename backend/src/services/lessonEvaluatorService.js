const prisma = require("../../prisma/client")
const sshClient = require("./sshService")
const logger = require("../lib/logger")
const { AppError, NotFoundError } = require("../lib/errors")
const linuxAccountService = require("./linuxAccountService")
const attemptService = require("./attemptService")

/** El evaluador vive dentro de la imagen del entorno, en ruta fija. */
const CHECKER = "/usr/local/lib/linuxlab/checker.py"
const SETUP = "/usr/local/lib/linuxlab/setup.py"

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
  const replacements = { $codigo: student.code, $correo: student.email }
  const output = {}
  for (const [key, value] of Object.entries(params ?? {})) {
    output[key] =
      typeof value === "string"
        ? Object.entries(replacements).reduce(
            (text, [token, real]) => text.split(token).join(real),
            value,
          )
        : value
  }
  return output
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

async function getBySlug(slug) {
  const activity = await prisma.activityDefinition.findUnique({
    where: { slug },
    include: { checks: { orderBy: { position: "asc" } } },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")
  return serialize(activity)
}

/**
 * La publicacion de esta actividad en el grupo activo del estudiante, si la hay.
 *
 * Devuelve null cuando el estudiante no esta matriculado, cuando la actividad
 * no esta publicada (las comprobaciones del temario nunca lo estan) o cuando el
 * docente la deshabilito. En los tres casos el intento se guarda igual, solo
 * que suelto: se pierde la nota, no el trabajo.
 */
async function publicacionDelEstudiante(activityDefinitionId, studentUserId) {
  const matricula = await prisma.enrollment.findFirst({
    where: { student_id: studentUserId, status: "active", group: { archived: false } },
    select: { group_id: true },
    orderBy: { enrolled_at: "asc" },
  })
  if (!matricula) return null

  return prisma.groupActivity.findFirst({
    where: {
      group_id: matricula.group_id,
      activity_definition_id: activityDefinitionId,
      enabled: true,
    },
    select: { id: true },
  })
}

/**
 * Corre las aserciones de una actividad sobre el entorno del estudiante.
 *
 * Quien evalua es el checker de la imagen, ejecutado CON LA IDENTIDAD del
 * estudiante: asi lo que se mide es lo que el estudiante puede ver y hacer, no
 * lo que puede root. Los parametros del docente viajan por stdin como JSON y
 * nunca se interpolan en la linea de comandos; lo unico que se arma como texto
 * es el nombre de la cuenta, validado contra el patron del servicio de cuentas.
 */
async function evaluate({ slug, studentUserId }) {
  const activity = await prisma.activityDefinition.findUnique({
    where: { slug },
    include: { checks: { orderBy: { position: "asc" } } },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")
  if (activity.checks.length === 0) {
    throw new AppError("La actividad no tiene aserciones que evaluar", 409, "CONFLICT")
  }

  const account = await linuxAccountService.getStudentAccount(studentUserId)

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
  // La comprobacion del temario se aprueba con una nota de 60 o mas.
  const passed = score >= 60

  // Las actividades del curso SI tienen publicacion en el grupo del estudiante,
  // y el intento tiene que colgar de ella: el libro de calificaciones busca por
  // `group_activity_id`, asi que sin esto la nota no llegaria ni al panel del
  // docente ni a "Mis calificaciones". Las comprobaciones del temario
  // (`kind: "check"`) siguen sin publicacion y quedan en NULL.
  const publicacion = await publicacionDelEstudiante(activity.id, studentUserId)

  await attemptService.recordAttempt({
    activityDefinitionId: activity.id,
    groupActivityId: publicacion?.id,
    studentUserId,
    passed,
    score,
    results,
  })

  logger.info({ slug, username: account.linux_username, passed, score }, "Activity evaluated")
  return { passed, score, maxScore: activity.max_score, results }
}

/**
 * Rehace el directorio de trabajo de una actividad desde cero.
 *
 * Es lo que hay detrás del botón de recargar: lo que hubiera se descarta entero
 * y el árbol vuelve a su estado inicial. Eso es lo que permite plantear
 * actividades donde el estudiante borre sin miedo a quedarse sin nada.
 */
async function resetSandbox({ slug, studentUserId, force = false }) {
  const activity = await prisma.activityDefinition.findUnique({
    where: { slug },
    select: { slug: true, setup: true },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")
  if (!activity.setup) {
    throw new AppError("Esta actividad no tiene archivos que preparar", 409, "CONFLICT")
  }

  const account = await linuxAccountService.getStudentAccount(studentUserId)
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

module.exports = {
  getBySlug,
  evaluate,
  resetSandbox,
  lastAttempt: attemptService.lastAttempt,
  passedSlugs: attemptService.passedSlugs,
  personalize,
  CHECKER,
  SETUP,
  EVAL_TIMEOUT_MS,
}
