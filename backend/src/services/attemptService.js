const prisma = require("../../prisma/client")
const { NotFoundError, ConflictError } = require("../lib/errors")
const { runInTransaction } = require("../lib/transaction")

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
 */
async function recordTopicAttempt({ studentId, topicActivityId, score, passed, results }) {
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

    return tx.topicSubmission.create({
      data: {
        enrollment_id: enrollment.id,
        topic_activity_id: topicActivityId,
        attempt_number: count + 1,
        score,
        passed,
        auto_results: results,
      },
    })
  })
}

/** Los slugs de comprobaciones del temario que el estudiante ya aprobo (nota >= 60). */
async function passedSlugs(studentId) {
  const submissions = await prisma.topicSubmission.findMany({
    where: { enrollment: { student_id: studentId }, score: { gte: 60 } },
    select: { topicActivity: { select: { slug: true } } },
    distinct: ["topic_activity_id"],
  })
  return submissions.map((s) => s.topicActivity.slug).filter(Boolean)
}

/** El ultimo intento del estudiante en una comprobacion del temario, para que la
 * leccion abra con su estado. */
async function lastAttempt({ slug, studentId }) {
  const activity = await prisma.topicActivity.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")

  const submission = await prisma.topicSubmission.findFirst({
    where: { topic_activity_id: activity.id, enrollment: { student_id: studentId } },
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
async function listAttempts({ slug, studentId }) {
  const activity = await prisma.topicActivity.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!activity) throw new NotFoundError("Actividad no encontrada")

  const submissions = await prisma.topicSubmission.findMany({
    where: { topic_activity_id: activity.id, enrollment: { student_id: studentId } },
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

module.exports = { recordGroupAttempt, recordTopicAttempt, passedSlugs, lastAttempt, listAttempts }
