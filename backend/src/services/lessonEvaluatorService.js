const prisma = require("../../prisma/client")
const { randomUUID } = require("crypto")
const sshClient = require("./sshService")
const logger = require("../lib/logger")
const { AppError, NotFoundError } = require("../lib/errors")
const linuxAccountService = require("./linuxAccountService")
const attemptService = require("./attemptService")
const { audit } = require("./auditService")
const { workdirOf } = require("../dtos/activityDtos")

const CHECKER = "/usr/local/lib/linuxlab/checker.py"
const SETUP = "/usr/local/lib/linuxlab/setup.py"

const EVAL_TIMEOUT_MS = 20000

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

const NEEDS_CODE = /\$codigo\b/

/**
 * La comprobacion tal como puede verla el estudiante.
 *
 * Sin `params`: ahi viven el contenido exacto que debe tener un archivo, el
 * modo octal o la ultima linea esperada, o sea la respuesta del ejercicio.
 * Viajaba al navegador junto al enunciado, de modo que se leia entera sin
 * intentar la actividad. Fuera del servidor solo salen el tipo y los puntos.
 */
const publicCheck = (check) => ({
  id: check.id,
  type: check.type,
  points: check.points,
})

function withIds(checks) {
  return (checks ?? []).map((c) => ({
    id: c.id ?? randomUUID(),
    type: c.type,
    params: c.params,
    points: c.points,
    position: c.position ?? 0,
  }))
}

const serialize = (activity) => ({
  id: activity.id,
  slug: activity.slug,
  title: activity.title,
  instructions: activity.instructions,
  topicNumber: activity.topic_id,
  maxScore: 100,
  hasSetup: Boolean(activity.setup),
  // La carpeta donde se trabaja, para poder volver a ella desde el enunciado.
  // Null en la que monta su arbol en la carpeta personal (ver activityDtos).
  workdir: workdirOf(activity.slug),
  checks: withIds(activity.checks).map(publicCheck),
})

async function getBySlug(slug) {
  const activity = await prisma.topicActivity.findUnique({
    where: { slug },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")
  return serialize(activity)
}

async function evaluate({ slug, studentUserId }) {
  const activity = await prisma.topicActivity.findUnique({
    where: { slug },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")

  const checks = withIds(activity.checks)
  if (checks.length === 0) {
    throw new AppError("La actividad no tiene aserciones que evaluar", 409, "CONFLICT")
  }

  const account = await linuxAccountService.getStudentAccount(studentUserId)

  const student = await prisma.user.findUnique({
    where: { id: studentUserId },
    select: { student: { select: { code: true } }, email: true },
  })

  const usesCode = checks.some((c) =>
    Object.values(c.params ?? {}).some((v) => typeof v === "string" && NEEDS_CODE.test(v)),
  )
  if (usesCode && !student?.student?.code) {
    throw new AppError("Tu perfil no tiene código estudiantil registrado", 409, "CONFLICT")
  }

  const payload = JSON.stringify({
    checks: checks.map((c) => ({
      id: c.id,
      type: c.type,
      params: personalize(c.params, { code: student?.student?.code, email: student?.email }),
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
  const results = checks.map((check) => {
    const outcome = byId.get(check.id)
    return {
      id: check.id,
      type: check.type,
      points: check.points,
      passed: outcome?.passed ?? false,
      detail: outcome?.detail ?? "No se pudo evaluar",
    }
  })

  const score = results.reduce((total, r) => total + (r.passed ? r.points : 0), 0)

  /* Una comprobacion de leccion o esta hecha o no lo esta: exige las cuatro
     condiciones. Con el 60 de las actividades, unos puntos 34/33/33 dejaban
     pasar dos de tres, asi que la tarjeta decia "Completada" con una condicion
     en rojo y el tema se daba por cerrado sin cumplirlo entero.

     Las actividades se quedan en el 60 porque ahi si hay nota parcial: valen
     para la bitacora y un 90 no puede ser un cero. */
  const passed = activity.kind === "check" ? results.every((r) => r.passed) : score >= 60

  const submission = await attemptService.recordTopicAttempt({
    studentId: studentUserId,
    topicActivityId: activity.id,
    score,
    passed,
    results,
  })

  /* Las del temario tambien dejan rastro. Antes solo se auditaban las del
     docente, asi que un estudiante podia resolver el curso entero sin que
     apareciera una linea en la bitacora.

     El `groupId` no es opcional: el docente ve la bitacora filtrada por sus
     grupos, de modo que un evento sin grupo no lo veria nadie. Sale de la
     matricula con la que se registro el intento. */
  audit({
    userId: studentUserId,
    groupId: submission.group_id,
    eventType: "activity_checked",
    target: activity.title,
    metadata: { topicActivityId: activity.id, slug, passed, score },
  })

  logger.info({ slug, username: account.linux_username, passed, score }, "Activity evaluated")
  return { passed, score, maxScore: 100, results }
}

async function resetSandbox({ slug, studentUserId, force = false }) {
  const activity = await prisma.topicActivity.findUnique({
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
  statusOf: attemptService.statusOf,
  personalize,
  CHECKER,
  SETUP,
  EVAL_TIMEOUT_MS,
}
