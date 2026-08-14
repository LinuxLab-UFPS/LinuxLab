const prisma = require("../../prisma/client")
const { NotFoundError } = require("../lib/errors")

/**
 * Registra un intento de actividad. El numero de intento sale de contar los
 * intentos previos del estudiante en esa actividad (la definicion o la
 * publicacion de curso, segun el caso).
 *
 * NOTA: el conteo + alta no es atomico (una carrera puede producir dos
 * intentos con el mismo numero); la serializacion se resuelve en la fase B4.
 */
async function recordAttempt({ activityDefinitionId, groupActivityId, studentUserId, passed, score, results }) {
  const countWhere = groupActivityId
    ? { group_activity_id: groupActivityId, student_id: studentUserId }
    : { activity_definition_id: activityDefinitionId, student_id: studentUserId }

  const attemptNumber = await prisma.activityAttempt.count({ where: countWhere })

  return prisma.activityAttempt.create({
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
