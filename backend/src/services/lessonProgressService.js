const prisma = require("../../prisma/client")

/**
 * Progreso de lectura de lecciones por subtema. Se scopea por grupo (regla:
 * un semestre, un grupo), asi al repetir el estudiante reinicia su temario de
 * lecciones para ese curso.
 */

/** Marca el subtema como leido por el estudiante en el grupo (idempotente). */
async function markRead({ studentId, groupId, subtopicId }) {
  await prisma.lessonProgress.upsert({
    where: {
      student_id_group_id_subtopic_id: {
        student_id: studentId,
        group_id: groupId,
        subtopic_id: subtopicId,
      },
    },
    update: {},
    create: { student_id: studentId, group_id: groupId, subtopic_id: subtopicId },
  })
  return { ok: true }
}

/** Los subtemas (id) leidos por el estudiante en el grupo. */
async function listRead({ studentId, groupId }) {
  const rows = await prisma.lessonProgress.findMany({
    where: { student_id: studentId, group_id: groupId },
    select: { subtopic_id: true, read_at: true },
  })
  return rows.map((r) => ({ subtopicId: r.subtopic_id, readAt: r.read_at }))
}

/** Resuelve un subtema (topicNumber, subtopicSlug) a su id. */
async function resolveSubtopicId({ topicNumber, subtopicSlug }) {
  const sub = await prisma.subtopic.findFirst({
    where: { slug: subtopicSlug, topic: { number: topicNumber } },
    select: { id: true },
  })
  return sub?.id ?? null
}

module.exports = { markRead, listRead, resolveSubtopicId }
