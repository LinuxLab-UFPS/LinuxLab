const prisma = require("../../prisma/client")
const accessService = require("./accessService")
const enrollmentService = require("./enrollmentService")
const lessonProgressService = require("./lessonProgressService")
const { NotFoundError } = require("../lib/errors")
const { finalScore } = require("../utils/finalScore")

/**
 * Progreso por grupo del temario (Fase 2). Semantica del seguimiento:
 *
 * - Un curso tiene un temario fijo (`Topic`/`Subtopic`) valido para todos los
 *   grupos; la unidad de trabajo es la actividad habilitada del grupo, a la que
 *   el panel suma las lecciones leidas (`LessonProgress`), ambas scopeadas por
 *   grupo (regla: un semestre, un grupo).
 * - `topicStatus` por estudiante: `completed` si cerro todas las actividades del
 *   tema y leyo todas sus lecciones; `in-progress` si avanzo en alguna; `overdue`
 *   si hay actividad habilitada vencida sin cerrar; `not-started` si no toco el
 *   tema.
 * - El progreso general y el `avgScore` usan la escala 0-100, igual que el
 *   cuaderno de calificaciones.
 */

const ACTIVITY_WINDOW_MS = 15 * 60 * 1000

function toStudent(enrollment) {
  return {
    id: enrollment.student.user_id,
    name: enrollment.student.user.name,
    email: enrollment.student.user.email,
    code: enrollment.student.code ?? "",
  }
}

/** Topics (con sus lecciones) y actividades habilitadas del grupo, en pocas consultas. */
async function loadCourseUnits(groupId) {
  const [topics, activities] = await Promise.all([
    prisma.topic.findMany({
      orderBy: { number: "asc" },
      include: { subTopics: { select: { id: true }, orderBy: { order: "asc" } } },
    }),
    prisma.groupActivity.findMany({
      where: { group_id: groupId, enabled: true },
      include: {
        definition: {
          select: { topic_id: true, title: true, source: true },
        },
      },
      orderBy: { created_at: "asc" },
    }),
  ])
  return { topics, activities }
}

/** Intentos y entregas del estudiante en las actividades habilitadas del grupo. */
async function loadStudentWork(studentId, activityIds) {
  const query =
    activityIds.length > 0
      ? {
          student_id: studentId,
          group_activity_id: { in: activityIds },
        }
      : { student_id: studentId, group_activity_id: { in: [] } }
  const [attempts, submissions] = await Promise.all([
    prisma.activityAttempt.findMany({ where: query, select: { group_activity_id: true, score: true, passed: true, created_at: true } }),
    prisma.activitySubmission.findMany({
      where: query,
      select: { group_activity_id: true, status: true, score: true, submitted_at: true, graded_at: true },
    }),
  ])
  const attemptMap = new Map()
  for (const a of attempts) {
    if (!attemptMap.has(a.group_activity_id)) attemptMap.set(a.group_activity_id, [])
    attemptMap.get(a.group_activity_id).push(a)
  }
  const submissionMap = new Map()
  for (const s of submissions) {
    if (!submissionMap.has(s.group_activity_id)) submissionMap.set(s.group_activity_id, [])
    submissionMap.get(s.group_activity_id).push(s)
  }
  return { attemptMap, submissionMap }
}

/** Estado de una actividad para un estudiante (escala 0-100 como el cuaderno). */
function activityGrade(ga, attempts, submission) {
  const overdue = Boolean(ga.due_at && new Date(ga.due_at) < new Date())
  if (ga.evaluation_type === "manual") {
    if (submission?.status === "graded" && submission.score !== null) {
      return { status: "completed", score: submission.score, date: submission.graded_at ?? submission.submitted_at }
    }
    if (submission) {
      return { status: "pending", score: null, date: submission.submitted_at }
    }
    return { status: overdue ? "overdue" : "not-started", score: overdue ? 0 : null, date: null }
  }
  if (!attempts || attempts.length === 0) {
    return { status: overdue ? "overdue" : "not-started", score: overdue ? 0 : null, date: null }
  }
  const score = finalScore(attempts)
  const latest = attempts.reduce((acc, a) => {
    const t = new Date(a.created_at).getTime()
    return acc === null || t > acc ? t : acc
  }, null)
  return { status: score > 0 ? "completed" : "pending", score, date: latest ? new Date(latest) : null }
}

/** Una casilla "tema" de un estudiante: actividades + lecciones. */
function buildTopicSummary(topic, groupActivities, attemptMap, submissionMap, readSubtopics) {
  const gaLis = groupActivities.filter((ga) => ga.definition?.topic_id === topic.id)
  const lessonIds = topic.subTopics.map((s) => s.id)
  let activitiesDone = 0
  let activitiesTotal = gaLis.length
  let overdue = false
  let lastDate = null
  const scores = []
  for (const ga of gaLis) {
    const sub = (submissionMap.get(ga.id) ?? [])[0] ?? null
    const grade = activityGrade(ga, attemptMap.get(ga.id) ?? [], sub)
    if (grade.status === "completed") {
      activitiesDone += 1
      if (grade.score !== null) scores.push(grade.score)
    }
    if (grade.status === "overdue") overdue = true
    if (grade.date && (lastDate === null || new Date(grade.date) > new Date(lastDate))) {
      lastDate = grade.date
    }
  }
  const lessonsDone = lessonIds.filter((id) => readSubtopics.has(id)).length
  const done = activitiesDone + lessonsDone
  const total = activitiesTotal + lessonIds.length

  let status
  if (done === 0) {
    status = overdue ? "overdue" : "not-started"
  } else if (total > 0 && done >= total) {
    status = "completed"
  } else {
    status = overdue ? "overdue" : "in-progress"
  }

  const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
  return {
    topic,
    topicNumber: topic.number,
    title: topic.title,
    completed: activitiesDone,
    total: activitiesTotal,
    status,
    avgScore,
    lastDate,
  }
}

async function ensureEnrollment(group, studentId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { group_id: group.id, student_id: studentId },
    include: { student: { select: { user_id: true, code: true, user: { select: { id: true, name: true, email: true } } } } },
  })
  return enrollment ?? null
}

/**
 * Detalle de un estudiante dentro de un grupo: progreso por tema, notas y
 * actividad reciente. Reutilizado por el endpoint del docente y por el "mine".
 */
async function getStudentGroupDetail({ groupId, studentId, teacherUserId, role, skipAccessCheck = false }) {
  const group = skipAccessCheck ? await prisma.group.findUnique({ where: { id: groupId } }) : await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  if (!group) throw new NotFoundError("Grupo no encontrado")

  const enrollment = await ensureEnrollment(group, studentId)
  if (!enrollment) return null

  const { topics, activities } = await loadCourseUnits(groupId)
  const { attemptMap, submissionMap } = await loadStudentWork(studentId, activities.map((a) => a.id))
  const reads = await lessonProgressService.listRead({ studentId, groupId })
  const readSubtopics = new Set(reads.map((r) => r.subtopicId))

  const topicProgress = topics.map((topic) => {
    const summary = buildTopicSummary(topic, activities, attemptMap, submissionMap, readSubtopics)
    return {
      topicNumber: summary.topicNumber,
      title: summary.title,
      completed: summary.completed,
      total: summary.total,
      avgScore: summary.avgScore,
    }
  })

  const overallDone = topicProgress.reduce((a, t) => a + t.completed, 0)
  const overallTotal = topicProgress.reduce((a, t) => a + t.total, 0)
  const overallProgress = overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0

  const grades = []
  for (const ga of activities) {
    const sub = (submissionMap.get(ga.id) ?? [])[0] ?? null
    const grade = activityGrade(ga, attemptMap.get(ga.id) ?? [], sub)
    const topic = topics.find((t) => ga.definition?.topic_id === t.id)
    grades.push({
      id: ga.id,
      activityName: ga.title,
      topicTitle: grade.status === "completed" ? (topic?.title ?? null) : null,
      source: ga.definition?.source ?? "teacher",
      score: grade.score,
      maxScore: ga.max_score,
      status: grade.status === "completed" ? "completed" : grade.status === "pending" ? "pending" : "not-started",
      date: grade.date?.toISOString() ?? undefined,
      evaluation: ga.evaluation_type === "manual" ? "manual" : "auto",
    })
  }

  const byDate = (a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : -Infinity
    const tb = b.date ? new Date(b.date).getTime() : -Infinity
    return tb - ta
  }
  const recentGrades = [...grades].filter((g) => g.status !== "not-started").sort(byDate).slice(0, 5)

  const lastTimestamps = reads.map((r) => new Date(r.readAt).getTime()).concat(
    [...attemptMap.values()].flat().map((a) => new Date(a.created_at).getTime()),
    [...submissionMap.values()].flat().map((s) => new Date(s.submitted_at).getTime()),
  )
  const lastActive = lastTimestamps.length > 0 ? new Date(Math.max(...lastTimestamps)).toISOString() : enrollment.enrolled_at.toISOString()

  return {
    student: toStudent(enrollment),
    groupName: group.name,
    enrolledAt: enrollment.enrolled_at.toISOString(),
    lastActive,
    overallProgress,
    topicProgress,
    recentGrades,
    grades,
  }
}

/** Resumen del grupo para el panel de seguimiento del docente. */
async function getGroupProgress({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const { topics, activities } = await loadCourseUnits(groupId)
  const enrollments = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    include: { student: { select: { user_id: true, code: true, user: { select: { id: true, name: true, email: true } } } } },
    orderBy: { enrolled_at: "asc" },
  })
  const activityIds = activities.map((a) => a.id)
  const now = Date.now()

  const rows = []
  let progressSum = 0
  let completedToday = 0
  let activeNow = 0

  for (const enrollment of enrollments) {
    const studentId = enrollment.student.user_id
    const { attemptMap, submissionMap } = await loadStudentWork(studentId, activityIds)
    const reads = await lessonProgressService.listRead({ studentId, groupId })
    const readSubtopics = new Set(reads.map((r) => r.subtopicId))

    const topicStatus = {}
    let done = 0
    let total = 0
    let lastDate = null
    let hadActivityToday = false

    for (const topic of topics) {
      const summary = buildTopicSummary(topic, activities, attemptMap, submissionMap, readSubtopics)
      topicStatus[summary.topicNumber] = summary.status
      done += summary.total > 0 ? summary.completed : 0
      total += summary.total
      if (summary.total > 0 && summary.lastDate) {
        const t = new Date(summary.lastDate).getTime()
        if (lastDate === null || t > lastDate) lastDate = t
        if (isToday(t)) hadActivityToday = true
      }
    }
    for (const r of reads) {
      const t = new Date(r.readAt).getTime()
      if (lastDate === null || t > lastDate) lastDate = t
      if (isToday(t)) hadActivityToday = true
    }
    for (const attempts of attemptMap.values()) {
      for (const a of attempts) {
        const t = new Date(a.created_at).getTime()
        if (lastDate === null || t > lastDate) lastDate = t
        if (isToday(t)) hadActivityToday = true
      }
    }
    for (const subs of submissionMap.values()) {
      for (const s of subs) {
        const t = new Date(s.submitted_at).getTime()
        if (lastDate === null || t > lastDate) lastDate = t
        if (isToday(t)) hadActivityToday = true
      }
    }

    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    progressSum += progress
    if (hadActivityToday) completedToday += 1
    if (lastDate !== null && now - lastDate <= ACTIVITY_WINDOW_MS) activeNow += 1

    rows.push({
      student: toStudent(enrollment),
      topicStatus,
      progress,
      lastActivity: lastDate !== null ? new Date(lastDate).toISOString() : "",
      activitiesDone: done,
      activitiesTotal: total,
    })
  }

  return {
    enrolledCount: enrollments.length,
    averageProgress: enrollments.length > 0 ? Math.round(progressSum / enrollments.length) : 0,
    completedToday,
    activeNow,
    rows,
  }
}

function isToday(timestamp) {
  const d = new Date(timestamp)
  const today = new Date()
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
}

/** Progreso propio del estudiante en su grupo activo (o null sin grupo). */
async function getMyProgress({ userId }) {
  const groupId = await enrollmentService.getActiveGroupId(userId)
  if (!groupId) return null
  return getStudentGroupDetail({ groupId, studentId: userId, skipAccessCheck: true })
}

/** Marca una leccion como leida en el grupo activo del estudiante. */
async function markLessonRead({ userId, topicNumber, subtopicSlug }) {
  const subtopicId = await lessonProgressService.resolveSubtopicId({ topicNumber, subtopicSlug })
  if (!subtopicId) throw new NotFoundError("Lección no encontrada en el temario")
  const groupId = await enrollmentService.getActiveGroupId(userId)
  if (!groupId) throw new NotFoundError("No tienes un grupo activo en este semestre")
  return lessonProgressService.markRead({ studentId: userId, groupId, subtopicId })
}

/** Lecciones leidas del estudiante en su grupo activo (para hidratar la UI). */
async function getMyReadLessons({ userId }) {
  const groupId = await enrollmentService.getActiveGroupId(userId)
  if (!groupId) return { lessons: [] }
  const read = await lessonProgressService.listRead({ studentId: userId, groupId })
  const subs = await prisma.subtopic.findMany({
    where: { id: { in: read.map((r) => r.subtopicId) } },
    select: { id: true, slug: true, topic: { select: { number: true } } },
  })
  const byId = new Map(subs.map((s) => [s.id, s]))
  const lessons = read
    .map((r) => {
      const sub = byId.get(r.subtopicId)
      if (!sub) return null
      return { topicNumber: sub.topic.number, subtopicSlug: sub.slug, readAt: r.readAt }
    })
    .filter(Boolean)
  return { lessons }
}

module.exports = { getGroupProgress, getStudentGroupDetail, getMyProgress, getMyReadLessons, markLessonRead }