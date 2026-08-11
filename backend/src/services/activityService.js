const { randomUUID } = require("crypto")
const prisma = require("../../prisma/client")
const sshClient = require("./sshClient")
const logger = require("../lib/logger")
const { AppError, NotFoundError, AuthorizationError } = require("../lib/errors")
const enrollmentService = require("./enrollmentService")
const groupService = require("./groupService")

/** El evaluador vive dentro de la imagen del entorno, en ruta fija. */
const CHECKER = "/usr/local/lib/linuxlab/checker.py"
const SETUP = "/usr/local/lib/linuxlab/setup.py"

/** Nombres de cuenta que puede haber en el contenedor. */
const USERNAME = /^[a-z_][a-z0-9_-]{0,31}$/

const EVAL_TIMEOUT_MS = 20000

/**
 * Validacion de parametros por tipo de asercion. El catalogo es el contrato con
 * el checker de la imagen: solo se aceptan los tipos que el conoce, y cada uno
 * valida sus propios campos. Devuelve null si esta bien, o un mensaje de error.
 */
const CHECK_VALIDATORS = {
  directorio_existe: ({ ruta }) => (ruta ? null : "Falta la ruta"),
  archivo_existe: ({ ruta }) => (ruta ? null : "Falta la ruta"),
  archivo_no_existe: ({ ruta }) => (ruta ? null : "Falta la ruta"),
  permisos_son: ({ ruta, modo }) => {
    if (!ruta) return "Falta la ruta"
    if (!/^[0-7]{3,4}$/.test(String(modo ?? ""))) return "El modo debe ser octal (ej: 755)"
    return null
  },
  propietario_es: ({ ruta, usuario }) => {
    if (!ruta) return "Falta la ruta"
    if (!usuario) return "Falta el usuario esperado"
    return null
  },
  archivo_contiene: ({ ruta, patron }) => {
    if (!ruta) return "Falta la ruta"
    if (patron === undefined || patron === null || patron === "") return "Falta el patrón a buscar"
    return null
  },
  minimo_lineas: ({ ruta, cantidad }) => {
    if (!ruta) return "Falta la ruta"
    if (!/^[1-9]\d*$/.test(String(cantidad ?? ""))) return "La cantidad debe ser un entero positivo"
    return null
  },
  archivo_es: ({ ruta, valor }) => {
    if (!ruta) return "Falta la ruta"
    if (valor === undefined || valor === null) return "Falta el valor esperado"
    return null
  },
  ultima_linea_es: ({ ruta, valor }) => {
    if (!ruta) return "Falta la ruta"
    if (valor === undefined || valor === null) return "Falta el valor esperado"
    return null
  },
}

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
  const activities = await prisma.activityDefinition.findMany({
    // Solo el banco: las definiciones que crea un docente (source=teacher) son
    // suyas y no deben aparecerle a nadie mas.
    where: { kind: "activity", source: "bank" },
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
    source: activity.source,
    difficulty: activity.difficulty,
    instructions: activity.instructions ?? "",
    maxScore: activity.max_score,
    required: false,
    evaluationType: activity.evaluation_type === "manual" ? "manual" : "atomic",
    checks: activity.checks.map(publicCheck),
    uses: activity._count.attempts,
  }))
}

async function getBySlug(slug) {
  const activity = await prisma.activityDefinition.findUnique({
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
  const activity = await prisma.activityDefinition.findUnique({
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

  // Los intentos por slug (comprobaciones del temario) no tienen publicacion:
  // group_activity_id queda NULL y el numero de intento es el siguiente del
  // estudiante en esta definicion.
  const attemptNumber = await prisma.activityAttempt.count({
    where: { activity_definition_id: activity.id, student_id: studentUserId },
  })

  await prisma.activityAttempt.create({
    data: {
      activity_definition_id: activity.id,
      student_id: studentUserId,
      attempt_number: attemptNumber + 1,
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
  const activity = await prisma.activityDefinition.findUnique({
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
    select: { definition: { select: { slug: true } } },
    distinct: ["activity_definition_id"],
  })
  return attempts.map((a) => a.definition.slug).filter(Boolean)
}

/** El ultimo intento del estudiante, para que la leccion abra con su estado. */
async function lastAttempt({ slug, studentUserId }) {
  const activity = await prisma.activityDefinition.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")

  const attempt = await prisma.activityAttempt.findFirst({
    where: { activity_definition_id: activity.id, student_id: studentUserId },
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

/** Normaliza la modalidad que manda el frontend ("atomic") a la de la base. */
function normalizeEvaluationType(value) {
  return value === "atomic" ? "automatic" : value
}

/**
 * Valida las aserciones de una actividad automatica y devuelve su snapshot con
 * ids generados en el servidor (los del cliente no se aceptan). Las posiciones
 * salen del orden de llegada y el puntaje debe repartir el maximo exacto.
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
    const validator = CHECK_VALIDATORS[check.type]
    if (!validator) {
      throw new AppError(`El tipo de aserción "${check.type}" no existe en el catálogo`, 400, "VALIDATION_ERROR")
    }
    const params = check.params ?? {}
    const error = validator(params)
    if (error) {
      throw new AppError(`Aserción ${i + 1} (${check.type}): ${error}`, 400, "VALIDATION_ERROR")
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

  if (total !== maxScore) {
    throw new AppError(
      `El puntaje repartido (${total}) no coincide con el de la actividad (${maxScore})`,
      400,
      "VALIDATION_ERROR",
    )
  }
  return checks
}

/** La forma que espera el frontend para la tabla de actividades de un curso. */
function serializeGroupActivity(ga, definition) {
  return {
    id: ga.id,
    title: ga.title,
    topicNumber: definition?.topic_number ?? 0,
    source: "teacher",
    difficulty: definition?.difficulty ?? "basic",
    instructions: ga.instructions ?? "",
    maxScore: ga.max_score,
    dueDate: ga.due_at?.toISOString(),
    required: ga.required,
    evaluationType: ga.evaluation_type === "manual" ? "manual" : "atomic",
    gradingPolicy: ga.grading_policy,
    checks: (ga.checks ?? []).map((c) => ({
      id: c.id,
      type: c.type,
      params: c.params,
      points: c.points,
    })),
    uses: 0,
  }
}

/** Registra un evento de auditoria; un fallo aqui nunca tumba la operacion. */
async function audit({ userId, groupId, eventType, target, metadata }) {
  try {
    await prisma.activityAuditEvent.create({
      data: {
        user_id: userId,
        group_id: groupId ?? null,
        event_type: eventType,
        target: target ?? null,
        metadata: metadata ?? undefined,
      },
    })
  } catch (err) {
    logger.error({ err, eventType }, "Audit event not recorded")
  }
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
  const group = await groupService.getGroupAccess({ groupId, teacherUserId, role })
  const body = input ?? {}

  const title = body.title?.trim()
  if (!title) throw new AppError("El nombre de la actividad es requerido", 400, "VALIDATION_ERROR")

  const maxScore = Number(body.maxScore)
  if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > 100) {
    throw new AppError("La puntuación máxima debe ser un entero entre 1 y 100", 400, "VALIDATION_ERROR")
  }

  const gradingPolicy = body.gradingPolicy ?? "best_score"
  if (!["best_score", "latest_score"].includes(gradingPolicy)) {
    throw new AppError("La política de calificación no es válida", 400, "VALIDATION_ERROR")
  }

  const evaluationType = normalizeEvaluationType(body.evaluationType ?? "automatic")
  if (!["automatic", "manual"].includes(evaluationType)) {
    throw new AppError("La modalidad de evaluación no es válida", 400, "VALIDATION_ERROR")
  }

  let dueAt = null
  if (body.dueDate) {
    dueAt = new Date(body.dueDate)
    if (Number.isNaN(dueAt.getTime())) {
      throw new AppError("La fecha de cierre no es válida", 400, "VALIDATION_ERROR")
    }
  }

  const topicNumber = Number(body.topicNumber)
  const checks = buildChecks(body.checks, { evaluationType, maxScore })

  const activity = await prisma.activityDefinition.create({
    data: {
      title,
      instructions: body.instructions?.trim() || null,
      topic_number: Number.isInteger(topicNumber) ? topicNumber : null,
      difficulty: body.difficulty ?? "basic",
      kind: "activity",
      activity_type: "workshop",
      evaluation_type: evaluationType,
      max_score: maxScore,
      source: "teacher",
      active: true,
      created_by: teacherUserId,
    },
  })

  const groupActivity = await prisma.groupActivity.create({
    data: {
      group_id: group.id,
      activity_definition_id: activity.id,
      title,
      instructions: activity.instructions,
      activity_type: "workshop",
      evaluation_type: evaluationType,
      max_score: maxScore,
      checks,
      attempt_limit: null,
      grading_policy: gradingPolicy,
      required: body.required !== false,
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

/** Las actividades publicadas en el grupo, para la pestaña de su curso. */
async function listGroupActivities({ groupId, teacherUserId, role }) {
  await groupService.getGroupAccess({ groupId, teacherUserId, role })
  const rows = await prisma.groupActivity.findMany({
    where: { group_id: groupId },
    include: { definition: { select: { topic_number: true, difficulty: true } } },
    orderBy: { created_at: "desc" },
  })
  return rows.map((ga) => serializeGroupActivity(ga, ga.definition))
}

async function getGroupActivity({ groupId, activityId, teacherUserId, role }) {
  await groupService.getGroupAccess({ groupId, teacherUserId, role })
  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
    include: { definition: { select: { topic_number: true, difficulty: true } } },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")
  return serializeGroupActivity(ga, ga.definition)
}

module.exports = {
  listBank,
  getBySlug,
  evaluate,
  resetSandbox,
  lastAttempt,
  passedSlugs,
  createGroupActivity,
  listGroupActivities,
  getGroupActivity,
}
