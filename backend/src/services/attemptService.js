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

module.exports = { recordAttempt, passedSlugs, lastAttempt }
