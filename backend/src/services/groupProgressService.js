const prisma = require("../../prisma/client")
const accessService = require("./accessService")

function round1(value) {
  return Math.round(value * 10) / 10
}

function formatDate(value) {
  return value ? new Date(value).toISOString() : null
}

/**
 * Progreso de contenidos de los estudiantes de un grupo.
 *
 * La fuente de verdad del "avance" es el temario estatico (12 temas). Un tema
 * cuenta completado cuando se aplica la regla de progressService: todos sus
 * subtemas leidos (LessonView) con sus actividades del banco aprobadas
 * (TopicSubmission) y las actividades independientes (kind=activity) aprobadas.
 *
 * El % total siempre se calcula contra los 12 temas del temario, no contra los
 * temas que un estudiante toco, para que las barras de la vista docente sean
 * comparables entre estudiantes. Ademas de topicStatus se devuelve un desglose
 * por tema (subtemas completados/total) para el modal de detalle.
 */
async function getGroupProgress({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const [topics, enrollments] = await Promise.all([
    prisma.topic.findMany({
      select: {
        order_number: true,
        title: true,
        subtopics: { select: { id: true } },
        activities: { select: { id: true, kind: true, subtopic_id: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: { group_id: groupId },
      include: { student: { include: { user: true } } },
      orderBy: { created_at: "asc" },
    }),
  ])
  if (enrollments.length === 0 || topics.length === 0) {
    return {
      enrolledCount: 0,
      averageProgress: 0,
      completedToday: 0,
      activeNow: 0,
      rows: [],
    }
  }

  const topicsOrdered = [...topics].sort((a, b) => a.order_number - b.order_number)
  const topicByNumber = new Map(topicsOrdered.map((t) => [t.order_number, t]))
  const enrollmentIds = enrollments.map((e) => e.id)

  const [topicProgress, topicSubmissions, lessonViews, groupSubmissions, groupActivities] =
    await Promise.all([
      prisma.topicProgress.findMany({
        where: { enrollment_id: { in: enrollmentIds } },
        select: { enrollment_id: true, topic: { select: { order_number: true } }, completed: true, completed_at: true },
      }),
      prisma.topicSubmission.findMany({
        where: { enrollment_id: { in: enrollmentIds } },
        select: {
          enrollment_id: true,
          topic_activity_id: true,
          score: true,
          passed: true,
          created_at: true,
          topicActivity: { select: { topic: { select: { order_number: true } } } },
        },
      }),
      prisma.lessonView.findMany({
        where: { enrollment_id: { in: enrollmentIds } },
        select: {
          enrollment_id: true,
          subtopic: { select: { id: true, topic: { select: { order_number: true } } } },
          created_at: true,
        },
      }),
      prisma.groupSubmission.findMany({
        where: { enrollment_id: { in: enrollmentIds } },
        select: { enrollment_id: true, group_activity_id: true, created_at: true },
      }),
      prisma.groupActivity.findMany({
        where: { group_id: groupId, enabled: true },
        select: { id: true },
      }),
    ])

  // Indices por matricula.
  const completedByEnrollment = new Map() // enrollmentId -> Set<topicNumber>
  const completedAtByKey = new Map() // `${enrollmentId}:${topicNumber}` -> Date
  for (const tp of topicProgress) {
    if (!tp.completed) continue
    if (!completedByEnrollment.has(tp.enrollment_id))
      completedByEnrollment.set(tp.enrollment_id, new Set())
    completedByEnrollment.get(tp.enrollment_id).add(tp.topic.order_number)
    if (tp.completed_at) completedAtByKey.set(`${tp.enrollment_id}:${tp.topic.order_number}`, tp.completed_at)
  }

  const viewedSubsByEnrollment = new Map() // enrollmentId -> Set<subtopicId>
  const passedActsByEnrollment = new Map() // enrollmentId -> Set<activityId>
  const lastActivityByEnrollment = new Map() // enrollmentId -> Date
  const scoreBuckets = new Map() // enrollmentId -> number[]
  const deliveredGroupByEnrollment = new Map() // enrollmentId -> Set<activityId>

  const touch = (enrollmentId, when) => {
    const prev = lastActivityByEnrollment.get(enrollmentId)
    if (!prev || new Date(when) > new Date(prev)) lastActivityByEnrollment.set(enrollmentId, when)
  }
  const addToSet = (map, key, value) => {
    if (!map.has(key)) map.set(key, new Set())
    map.get(key).add(value)
  }

  for (const lv of lessonViews) {
    addToSet(viewedSubsByEnrollment, lv.enrollment_id, lv.subtopic.id)
    touch(lv.enrollment_id, lv.created_at)
  }
  for (const ts of topicSubmissions) {
    if (ts.passed) addToSet(passedActsByEnrollment, ts.enrollment_id, ts.topic_activity_id)
    if (!scoreBuckets.has(ts.enrollment_id)) scoreBuckets.set(ts.enrollment_id, [])
    scoreBuckets.get(ts.enrollment_id).push(ts.score)
    touch(ts.enrollment_id, ts.created_at)
  }
  for (const gs of groupSubmissions) {
    addToSet(deliveredGroupByEnrollment, gs.enrollment_id, gs.group_activity_id)
    touch(gs.enrollment_id, gs.created_at)
  }
  const activitiesTotal = groupActivities.length

  // Desglose por tema para cada matricula: subtemas completados sobre total.
  const perTopicByEnrollment = new Map() // enrollmentId -> Map<topicNumber, {completed,total,touched}>
  for (const enrollment of enrollments) {
    const viewed = viewedSubsByEnrollment.get(enrollment.id) ?? new Set()
    const passed = passedActsByEnrollment.get(enrollment.id) ?? new Set()

    const perTopic = new Map()
    for (const topic of topicsOrdered) {
      const activitiesBySubtopic = new Map() // subtopicId -> activityIds[]
      for (const a of topic.activities) {
        if (a.subtopic_id != null) {
          if (!activitiesBySubtopic.has(a.subtopic_id)) activitiesBySubtopic.set(a.subtopic_id, [])
          activitiesBySubtopic.get(a.subtopic_id).push(a.id)
        }
      }

      let subtopicsDone = 0
      let touched = 0
      for (const sub of topic.subtopics) {
        if (!viewed.has(sub.id)) continue
        touched++
        const acts = activitiesBySubtopic.get(sub.id)
        if (acts && acts.some((id) => !passed.has(id))) continue
        subtopicsDone++
      }

      perTopic.set(topic.order_number, {
        completed: subtopicsDone,
        total: topic.subtopics.length,
        touched,
      })
    }
    perTopicByEnrollment.set(enrollment.id, perTopic)
  }

  const now = new Date()
  const DAY = 24 * 60 * 60 * 1000
  const activeWindow = 5 * 60 * 1000

  const totalTopics = topicsOrdered.length

  const rows = enrollments.map((e) => {
    const studentUserId = e.student.user.id
    const completed = completedByEnrollment.get(e.id) ?? new Set()
    const perTopic = perTopicByEnrollment.get(e.id) ?? new Map()

    const topicStatus = {}
    const topicProgress = []
    for (const topic of topicsOrdered) {
      const n = topic.order_number
      const d = perTopic.get(n) ?? { completed: 0, total: 0, touched: 0 }
      topicStatus[n] = completed.has(n)
        ? "completed"
        : d.touched > 0
          ? "in-progress"
          : "not-started"
      topicProgress.push({
        topicNumber: n,
        title: topic.title,
        completed: d.completed,
        total: d.total,
      })
    }

    const lastActivity = lastActivityByEnrollment.get(e.id)
    const progress = Math.round((completed.size / totalTopics) * 100)

    const scores = scoreBuckets.get(e.id) ?? []
    const averageScore = scores.length > 0 ? round1(scores.reduce((a, b) => a + b, 0) / scores.length) : undefined

    return {
      student: {
        id: studentUserId,
        name: e.student.user.name,
        email: e.student.user.email,
        code: e.student.code,
      },
      topicStatus,
      topicProgress,
      progress,
      lastActivity: lastActivity ? formatDate(lastActivity) : "",
      activitiesDone: (deliveredGroupByEnrollment.get(e.id) ?? new Set()).size,
      activitiesTotal,
      averageScore,
    }
  })

  const completedToday = topicProgress.filter((tp) => {
    if (!tp.completed || !tp.completed_at) return false
    return now.getTime() - new Date(tp.completed_at).getTime() <= DAY
  }).length

  const activeNow = enrollments.filter((e) => {
    const t = lastActivityByEnrollment.get(e.id)
    return t && now.getTime() - new Date(t).getTime() <= activeWindow
  }).length

  const averageProgress =
    rows.length > 0 ? round1(rows.reduce((a, r) => a + r.progress, 0) / rows.length) : 0

  return {
    enrolledCount: enrollments.length,
    averageProgress,
    completedToday,
    activeNow,
    rows,
  }
}

module.exports = { getGroupProgress }