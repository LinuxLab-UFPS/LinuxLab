const prisma = require("../../prisma/client")
const { NotFoundError, ConflictError } = require("../lib/errors")
const { runInTransaction } = require("../lib/transaction")
const { recomputeTopicProgress } = require("./progressService")

/**
 * Los envios que cuentan para lo que el estudiante ve HOY: los de su matricula
 * vigente, no los de todas las que haya tenido.
 *
 * Cada matricula es un curso: al archivar un grupo, el trabajo hecho ahi queda
 * como historico y el estudiante empieza de cero en el siguiente. Sin esta
 * condicion, las tarjetas de actividad se pintaban como completadas con
 * intentos de un grupo archivado mientras el progreso del temario —que si
 * filtra por matricula activa— salia en cero. Dos cifras del mismo estudiante
 * que no cuadraban entre si.
 *
 * El historico no se borra ni se toca: sigue en la base para el docente y para
 * los certificados ya emitidos, que deben poder consultarse siempre.
 */
const matriculaVigente = (studentUserId) => ({
  student_id: studentUserId,
  status: "active",
  group: { status: "active" },
})

/**
 * Corta la consulta si no llega el estudiante.
 *
 * Prisma BORRA las claves `undefined` de un `where` en vez de no encontrar
 * nada: un id que no llega no restringe menos, deja de restringir. La consulta
 * pasa de "los intentos de esta persona" a "los intentos de cualquiera" sin un
 * solo error, y el fallo solo se ve cuando alguien nota datos ajenos en su
 * pantalla. Fallar aqui, ruidosamente, es lo unico que lo convierte en algo
 * imposible de pasar por alto.
 */
function exigirEstudiante(studentUserId) {
  if (!studentUserId) {
    throw new Error("attemptService: falta el id del estudiante en la consulta")
  }
}

/**
 * Registra un intento de actividad de grupo. El numero de intento sale de contar
 * los intentos previos del estudiante en esa publicacion.
 *
 * El conteo + alta viven en una transaccion que bloquea la fila de la matricula
 * (FOR UPDATE): dos evaluaciones concurrentes del mismo estudiante se serializan
 * en el lock y no pueden producir dos intentos con el mismo numero. Estudiantes
 * distintos no se bloquean entre si.
 *
 * Con `attemptLimit` configurado, el limite se valida en la MISMA transaccion:
 * contar y crear son una operacion atomica, asi que dos checks concurrentes no
 * pueden colarse pasadas ya consumidas (sin TOCTOU). Un intento fallido tambien
 * consume intento (el registro se crea igual), conforme a las reglas de negocio.
 */
async function recordGroupAttempt({ studentId, groupId, groupActivityId, score, passed, results, attemptLimit }) {
  exigirEstudiante(studentId)
  return runInTransaction(async (tx) => {
    const enrollment = await tx.enrollment.findFirst({
      where: { student_id: studentId, group_id: groupId, status: "active", group: { status: "active" } },
    })
    if (!enrollment) throw new ConflictError("No hay matrícula activa en este grupo")

    await tx.$queryRaw`SELECT id FROM "Enrollment" WHERE id = ${enrollment.id} FOR UPDATE`

    const count = await tx.groupSubmission.count({
      where: { enrollment_id: enrollment.id, group_activity_id: groupActivityId },
    })

    if (attemptLimit !== undefined && attemptLimit !== null && count >= attemptLimit) {
      throw new ConflictError("Alcanzaste el límite de intentos de esta actividad")
    }

    const submission = await tx.groupSubmission.create({
      data: {
        enrollment_id: enrollment.id,
        group_activity_id: groupActivityId,
        attempt_number: count + 1,
        status: "graded",
        score,
        passed,
      },
    })

    await tx.submissionAutoDetail.create({
      data: { submission_id: submission.id, auto_results: results },
    })

    return submission
  })
}

/**
 * Registra un intento de comprobacion del temario. No requiere grupo especifico:
 * se usa la matricula activa del estudiante (cualquier grupo). No tiene limite de
 * intentos (el estudiante puede reintentar cuantas veces necesite).
 *
 * Al terminar recalcula el progreso del tema. Antes no lo hacia, y la regla que
 * decide si un tema esta completo (progressService, que ya exige tener las
 * actividades aprobadas) solo se evaluaba al abrir una leccion: aprobar una
 * actividad no movia la barra hasta que el estudiante volvia a leer algo. El
 * sintoma era que leer subia el progreso y trabajar no.
 *
 * Devuelve tambien el grupo de la matricula, que quien llama necesita para dejar
 * el rastro en la bitacora: un evento sin `group_id` no lo ve ningun docente.
 */
async function recordTopicAttempt({ studentId, topicActivityId, score, passed, results }) {
  exigirEstudiante(studentId)
  return runInTransaction(async (tx) => {
    const enrollment = await tx.enrollment.findFirst({
      where: { student_id: studentId, status: "active", group: { status: "active" } },
      orderBy: { created_at: "asc" },
    })
    if (!enrollment) throw new ConflictError("No hay matrícula activa")

    await tx.$queryRaw`SELECT id FROM "Enrollment" WHERE id = ${enrollment.id} FOR UPDATE`

    const count = await tx.topicSubmission.count({
      where: { enrollment_id: enrollment.id, topic_activity_id: topicActivityId },
    })

    const submission = await tx.topicSubmission.create({
      data: {
        enrollment_id: enrollment.id,
        topic_activity_id: topicActivityId,
        attempt_number: count + 1,
        score,
        passed,
        auto_results: results,
      },
    })

    const activity = await tx.topicActivity.findUnique({
      where: { id: topicActivityId },
      select: { topic_id: true },
    })
    if (activity) {
      await recomputeTopicProgress(tx, enrollment.id, activity.topic_id)
    }

    return { ...submission, group_id: enrollment.group_id }
  })
}

/**
 * El estado del temario para un estudiante: los slugs que aprobo y la nota del
 * ultimo intento de cada actividad que haya intentado, aprobada o no.
 *
 * Es la respuesta de `GET /api/activities/mine/status`, la que pintan las
 * tarjetas ("Completada" + nota) y el filtro de estado del catalogo. Sale de
 * una sola consulta ordenada por fecha y el ultimo registro por actividad
 * gana: la misma politica de "ultimo intento" que aplica `finalScore` en el
 * cuaderno, para que una tarjeta y el boletin nunca den notas distintas de la
 * misma actividad.
 */
async function statusOf(studentUserId) {
  exigirEstudiante(studentUserId)
  const submissions = await prisma.topicSubmission.findMany({
    where: { enrollment: matriculaVigente(studentUserId) },
    orderBy: { created_at: "asc" },
    select: {
      score: true,
      passed: true,
      topicActivity: { select: { slug: true } },
    },
  })

  const passed = new Set()
  const scores = new Map()
  for (const s of submissions) {
    const slug = s.topicActivity.slug
    if (!slug) continue
    if (s.passed) passed.add(slug)
    scores.set(slug, { score: s.score, maxScore: 100 })
  }
  return { passed: [...passed], scores: Object.fromEntries(scores) }
}

/**
 * Cuantas actividades del temario lleva aprobadas cada matricula de una lista.
 *
 * Solo `kind: "activity"`: las de tipo `check` son ejercicios dentro de una
 * leccion, no actividades con tarjeta propia, y contarlas daria un total que no
 * coincide con lo que el estudiante ve.
 *
 * Devuelve un Map enrollmentId -> numero. Lo usan el cuaderno y la lista de
 * estudiantes, que tienen que decir lo mismo.
 */
async function passedTopicCountByEnrollment(enrollmentIds) {
  if (enrollmentIds.length === 0) return new Map()

  const rows = await prisma.topicSubmission.findMany({
    where: {
      enrollment_id: { in: enrollmentIds },
      passed: true,
      topicActivity: { kind: "activity" },
    },
    select: { enrollment_id: true, topic_activity_id: true },
    distinct: ["enrollment_id", "topic_activity_id"],
  })

  const counts = new Map()
  for (const row of rows) {
    counts.set(row.enrollment_id, (counts.get(row.enrollment_id) ?? 0) + 1)
  }
  return counts
}

/** Cuantas actividades trae el temario. Es el denominador del "N de M". */
async function topicActivitiesTotal() {
  return prisma.topicActivity.count({ where: { kind: "activity" } })
}

/** El ultimo intento del estudiante en una comprobacion del temario, para que la
 * leccion abra con su estado. */
async function lastAttempt({ slug, studentUserId }) {
  exigirEstudiante(studentUserId)
  const activity = await prisma.topicActivity.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")

  const submission = await prisma.topicSubmission.findFirst({
    where: { topic_activity_id: activity.id, enrollment: matriculaVigente(studentUserId) },
    orderBy: { created_at: "desc" },
  })
  if (!submission) return null
  return {
    passed: submission.passed,
    score: submission.score,
    results: submission.auto_results,
    at: submission.created_at,
  }
}

/** Todos los intentos del estudiante en una comprobacion del temario, del mas
 * reciente al mas antiguo, para la tabla de intentos de la vista del estudiante. */
async function listAttempts({ slug, studentUserId }) {
  exigirEstudiante(studentUserId)
  const activity = await prisma.topicActivity.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")

  const submissions = await prisma.topicSubmission.findMany({
    where: { topic_activity_id: activity.id, enrollment: matriculaVigente(studentUserId) },
    orderBy: { created_at: "desc" },
    select: {
      attempt_number: true,
      passed: true,
      score: true,
      created_at: true,
    },
  })
  return submissions.map((s) => ({
    attemptNumber: s.attempt_number,
    passed: s.passed,
    score: s.score,
    createdAt: s.created_at.toISOString(),
  }))
}

module.exports = {
  recordGroupAttempt,
  recordTopicAttempt,
  statusOf,
  passedTopicCountByEnrollment,
  topicActivitiesTotal,
  lastAttempt,
  listAttempts,
}
