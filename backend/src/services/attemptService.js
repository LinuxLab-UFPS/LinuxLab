const prisma = require("../../prisma/client")
const { NotFoundError, ConflictError } = require("../lib/errors")
const { runInTransaction } = require("../lib/transaction")

/**
 * Registra un intento de actividad. El numero de intento sale de contar los
 * intentos previos del estudiante en esa actividad (la definicion o la
 * publicacion de curso, segun el caso).
 *
 * El conteo + alta viven en una transaccion que bloquea la fila del estudiante
 * (FOR UPDATE): dos evaluaciones concurrentes del mismo estudiante se
 * serializan en el lock y no pueden producir dos intentos con el mismo numero.
 * Estudiantes distintos no se bloquean entre si.
 *
 * Con `attemptLimit` configurado, el limite se valida en la MISMA transaccion:
 * contar y crear son una operacion atomica, asi que dos checks concurrentes no
 * pueden colarse pasadas ya consumidas (sin TOCTOU). Un intento fallido tambien
 * consume intento (el registro se crea igual), conforme a las reglas de negocio.
 */
async function recordAttempt({ activityDefinitionId, groupActivityId, studentUserId, passed, score, results, attemptLimit }) {
  return runInTransaction(async (tx) => {
    const countWhere = groupActivityId
      ? { group_activity_id: groupActivityId, student_id: studentUserId }
      : { activity_definition_id: activityDefinitionId, student_id: studentUserId }

    // Serializa los intentos de este estudiante: la segunda transaccion espera
    // a que la primera confirme antes de contar de nuevo. El nombre de la
    // tabla es `"User"` (Prisma no la mapea, la usa tal cual).
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${studentUserId} FOR UPDATE`

    const attemptNumber = await tx.activityAttempt.count({ where: countWhere })

    if (attemptLimit !== undefined && attemptLimit !== null && attemptNumber >= attemptLimit) {
      throw new ConflictError("Alcanzaste el límite de intentos de esta actividad")
    }

    return tx.activityAttempt.create({
      data: {
        activity_definition_id: activityDefinitionId,
        group_activity_id: groupActivityId ?? null,
        student_id: studentUserId,
        attempt_number: attemptNumber + 1,
        passed,
        score,
        results,
      },
    })
  })
}

/** Los slugs que el estudiante ya aprobo (nota >= 60), para marcar sus tarjetas. */
async function passedSlugs(studentUserId) {
  const attempts = await prisma.activityAttempt.findMany({
    where: { student_id: studentUserId, score: { gte: 60 } },
    select: { definition: { select: { slug: true } } },
    distinct: ["activity_definition_id"],
  })
  return attempts.map((a) => a.definition.slug).filter(Boolean)
}

/**
 * La nota de cada actividad que el estudiante haya intentado, por slug.
 *
 * Es la del ULTIMO intento y no la mejor, que es el mismo criterio que usa
 * `finalScore` para el libro de calificaciones: si vuelve a entregar, lo que
 * vale es lo ultimo que entrego. Sirve para pintar la nota en la tarjeta sin
 * pedir el detalle de cada actividad por separado.
 */
async function scoresBySlug(studentUserId) {
  const attempts = await prisma.activityAttempt.findMany({
    where: { student_id: studentUserId, definition: { slug: { not: null } } },
    select: {
      score: true,
      definition: { select: { slug: true, max_score: true } },
    },
    // El mas reciente primero: `distinct` se queda con la primera fila de cada
    // definicion, asi que este orden es lo que hace que gane el ultimo intento.
    orderBy: { created_at: "desc" },
    distinct: ["activity_definition_id"],
  })

  const scores = {}
  for (const a of attempts) {
    if (!a.definition?.slug) continue
    scores[a.definition.slug] = { score: a.score, maxScore: a.definition.max_score }
  }
  return scores
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

/** Todos los intentos del estudiante en una actividad del temario, del mas
 * reciente al mas antiguo, para la tabla de intentos de la vista del estudiante. */
async function listAttempts({ slug, studentUserId }) {
  const activity = await prisma.activityDefinition.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")

  const attempts = await prisma.activityAttempt.findMany({
    where: { activity_definition_id: activity.id, student_id: studentUserId },
    orderBy: { created_at: "desc" },
    select: {
      attempt_number: true,
      passed: true,
      score: true,
      created_at: true,
    },
  })
  return attempts.map((a) => ({
    attemptNumber: a.attempt_number,
    passed: a.passed,
    score: a.score,
    createdAt: a.created_at.toISOString(),
  }))
}

module.exports = { recordAttempt, passedSlugs, scoresBySlug, lastAttempt, listAttempts }
