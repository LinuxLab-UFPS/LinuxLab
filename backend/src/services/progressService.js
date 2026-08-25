const prisma = require("../../prisma/client")

/**
 * Recomputa el progreso de un tema para una matricula. El tema está completo
 * cuando todos sus subtopics están leídos (y sus checks aprobados, si tienen) y
 * todas las actividades del banco del tema están aprobadas (score >= 60).
 */
async function recomputeTopicProgress(tx, enrollmentId, topicId) {
  const topic = await tx.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      subtopics: { select: { id: true } },
      activities: { select: { id: true, kind: true, subtopic_id: true } },
    },
  })
  if (!topic) return

  const subtopicIds = topic.subtopics.map((s) => s.id)
  const activityIds = topic.activities.map((a) => a.id)

  const [viewedSubs, passedSubs] = await Promise.all([
    tx.lessonView.findMany({
      where: { enrollment_id: enrollmentId, subtopic_id: { in: subtopicIds } },
      select: { subtopic_id: true },
    }),
    tx.topicSubmission.findMany({
      where: { enrollment_id: enrollmentId, passed: true, topic_activity_id: { in: activityIds } },
      select: { topic_activity_id: true },
    }),
  ])

  const viewed = new Set(viewedSubs.map((v) => v.subtopic_id))
  const passed = new Set(passedSubs.map((p) => p.topic_activity_id))
  const activitiesBySubtopic = new Map()
  for (const a of topic.activities) {
    if (a.subtopic_id != null) {
      if (!activitiesBySubtopic.has(a.subtopic_id)) activitiesBySubtopic.set(a.subtopic_id, [])
      activitiesBySubtopic.get(a.subtopic_id).push(a.id)
    }
  }

  let subtopicsDone = 0
  for (const sub of topic.subtopics) {
    if (!viewed.has(sub.id)) continue
    const acts = activitiesBySubtopic.get(sub.id)
    if (acts && acts.some((id) => !passed.has(id))) continue
    subtopicsDone++
  }

  const activities = topic.activities.filter((a) => a.kind === "activity")
  const activitiesDone = activities.filter((a) => passed.has(a.id)).length

  const completed = subtopicsDone >= topic.subtopics.length && activitiesDone >= activities.length

  await tx.topicProgress.upsert({
    where: { enrollment_id_topic_id: { enrollment_id: enrollmentId, topic_id: topicId } },
    update: { completed, completed_at: completed ? new Date() : null },
    create: { enrollment_id: enrollmentId, topic_id: topicId, completed, completed_at: completed ? new Date() : null },
  })
}

/**
 * Registra que un estudiante vio un subtopic. Crea/actualiza el LessonView y
 * recomputa el progreso del tema.
 */
async function recordLessonView(tx, enrollmentId, subtopicId) {
  await tx.lessonView.upsert({
    where: { enrollment_id_subtopic_id: { enrollment_id: enrollmentId, subtopic_id: subtopicId } },
    update: { view_count: { increment: 1 } },
    create: { enrollment_id: enrollmentId, subtopic_id: subtopicId, view_count: 1 },
  })

  const subtopic = await tx.subtopic.findUnique({
    where: { id: subtopicId },
    select: { topic_id: true },
  })
  if (subtopic) {
    await recomputeTopicProgress(tx, enrollmentId, subtopic.topic_id)
  }
}

module.exports = { recomputeTopicProgress, recordLessonView }
