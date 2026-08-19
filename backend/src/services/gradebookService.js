const prisma = require("../../prisma/client")
const accessService = require("./accessService")
const { NotFoundError } = require("../lib/errors")
const { finalScore } = require("../utils/finalScore")

function key(studentId, groupActivityId) {
  return `${studentId}::${groupActivityId}`
}

function round1(value) {
  return Math.round(value * 10) / 10
}

/**
 * Estado y nota de una casilla estudiante x actividad.
 *
 * - automaticas con intentos -> `completed` con nota final (finalScore).
 * - manuales con entrega calificada (`graded`) -> `completed`.
 * - manuales en revision (`submitted`/`under_review`) -> `under-review`.
 * - sin actividad y con cierre vencido -> `overdue` con nota 0 (penaliza en el
 *   promedio; "no entregar" no es lo mismo que "sin evaluar").
 * - sin actividad y sin cierre vencido -> `not-started` sin nota.
 */
function buildCell(ga, attempts, submissions, now) {
  if (ga.evaluation_type === "manual") {
    const sub = submissions[0] ?? null
    if (!sub) {
      const overdue = ga.due_at && new Date(ga.due_at) < now
      return {
        score: overdue ? 0 : null,
        status: overdue ? "overdue" : "not-started",
        attempts: 0,
        lastDate: null,
      }
    }
    if (sub.status === "graded") {
      return {
        score: sub.score ?? null,
        status: "completed",
        attempts: 1,
        lastDate: sub.graded_at ?? sub.submitted_at,
      }
    }
    return { score: null, status: "under-review", attempts: 1, lastDate: sub.submitted_at }
  }

  if (attempts.length === 0) {
    const overdue = ga.due_at && new Date(ga.due_at) < now
    return {
      score: overdue ? 0 : null,
      status: overdue ? "overdue" : "not-started",
      attempts: 0,
      lastDate: null,
    }
  }

  return {
    score: finalScore(attempts),
    status: "completed",
    attempts: attempts.length,
    lastDate: attempts.reduce((acc, a) => {
      const t = new Date(a.created_at).getTime()
      return acc === null || t > acc ? t : acc
    }, null),
  }
}

/**
 * La nota que aporta una casilla al promedio. Solo las completadas (su nota) y
 * las vencidas sin entregar (0) cuentan: las que estan en revision o sin
 * iniciar aun no tienen evaluacion y no penalizan.
 */
function contributesToAverage(cell) {
  return cell.status === "completed" && cell.score !== null || cell.status === "overdue"
}

function averageValueOf(cell) {
  return cell.status === "overdue" ? 0 : cell.score
}

/**
 * Carga en pocas consultas todo lo que alimenta el cuaderno: actividades
 * habilitadas del grupo, estudiantes matriculados e intentos y entregas de la
 * carpeta. Se indexan en memoria por (estudiante, actividad) para que las
 * casillas no cuesten N x M consultas.
 */
async function loadGroupData(groupId) {
  const activities = await prisma.groupActivity.findMany({
    where: { group_id: groupId, enabled: true },
    include: { definition: { select: { topic_number: true } } },
    orderBy: { created_at: "asc" },
  })

  const enrollments = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    select: { student: { select: { id: true, name: true, email: true, code: true } } },
    orderBy: { enrolled_at: "asc" },
  })

  const activityIds = activities.map((a) => a.id)
  const [attempts, submissions] = await Promise.all([
    activityIds.length > 0
      ? prisma.activityAttempt.findMany({
          where: { group_activity_id: { in: activityIds } },
          select: { student_id: true, group_activity_id: true, score: true, created_at: true },
        })
      : Promise.resolve([]),
    activityIds.length > 0
      ? prisma.activitySubmission.findMany({
          where: { group_activity_id: { in: activityIds } },
          select: {
            student_id: true,
            group_activity_id: true,
            status: true,
            score: true,
            submitted_at: true,
            graded_at: true,
          },
        })
      : Promise.resolve([]),
  ])

  const attemptMap = new Map()
  for (const a of attempts) {
    const k = key(a.student_id, a.group_activity_id)
    if (!attemptMap.has(k)) attemptMap.set(k, [])
    attemptMap.get(k).push({ score: a.score, created_at: a.created_at })
  }

  const submissionMap = new Map()
  for (const s of submissions) {
    const k = key(s.student_id, s.group_activity_id)
    if (!submissionMap.has(k)) submissionMap.set(k, [])
    submissionMap.get(k).push(s)
  }
  for (const list of submissionMap.values()) {
    list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
  }

  return { activities, enrollments, attemptMap, submissionMap }
}

/**
 * Cuaderno del docente: una fila por estudiante, una columna por actividad,
 * con promedio por actividad y por estudiante.
 */
async function getGroupGradebook({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const { activities, enrollments, attemptMap, submissionMap } = await loadGroupData(groupId)

  const students = enrollments.map((e) => e.student)
  const now = new Date()

  const cells = {}
  const activitySums = new Map()
  const studentSums = new Map()

  for (const ga of activities) {
    const gaId = ga.id
    const aAvg = { sum: 0, count: 0 }
    activitySums.set(gaId, aAvg)

    for (const student of students) {
      const cell = buildCell(ga, attemptMap.get(key(student.id, gaId)) ?? [], submissionMap.get(key(student.id, gaId)) ?? [], now)
      if (!cells[student.id]) cells[student.id] = {}
      cells[student.id][gaId] = cell

      if (contributesToAverage(cell)) {
        const value = averageValueOf(cell)
        aAvg.sum += value
        aAvg.count += 1
        const sAvg = studentSums.get(student.id) ?? { sum: 0, count: 0 }
        sAvg.sum += value
        sAvg.count += 1
        studentSums.set(student.id, sAvg)
      }
    }
  }

  const activityAverages = {}
  for (const [gaId, { sum, count }] of activitySums) {
    activityAverages[gaId] = count > 0 ? round1(sum / count) : null
  }
  const studentAverages = {}
  for (const [studentId, { sum, count }] of studentSums) {
    studentAverages[studentId] = count > 0 ? round1(sum / count) : null
  }

  return {
    students: students.map((s) => ({ id: s.id, name: s.name, code: s.code })),
    activities: activities.map((ga) => ({
      id: ga.id,
      activityNumber: ga.activity_number,
      workdir: ga.workdir,
      title: ga.title,
      topicNumber: ga.definition?.topic_number ?? null,
      evaluationType: ga.evaluation_type === "manual" ? "manual" : "automatic",
      activityType: ga.activity_type === "quiz" ? "quiz" : "workshop",
      dueAt: ga.due_at?.toISOString() ?? null,
      enabled: ga.enabled,
      maxScore: ga.max_score,
    })),
    cells,
    activityAverages,
    studentAverages,
  }
}

/** El estado de casilla (kebab) a su clave en el resumen (camel). */
const STATUS_TO_KEY = {
  completed: "completed",
  "under-review": "underReview",
  overdue: "overdue",
  "not-started": "notStarted",
}

function summarizeSeries(series) {
  const summary = {
    average: null,
    completed: 0,
    underReview: 0,
    overdue: 0,
    notStarted: 0,
    total: series.length,
  }
  let sum = 0
  let count = 0
  for (const s of series) {
    if (s.score !== null) {
      sum += s.score
      count += 1
    }
    summary[STATUS_TO_KEY[s.status]] += 1
  }
  summary.average = count > 0 ? round1(sum / count) : null
  return summary
}

/**
 * Serie del estudiante por actividad (para la linea de rendimiento) y
 * desglose por tema, mas el promedio del grupo por actividad como referencia.
 */
function buildSeriesForStudent(studentId, activities, groupStudentIds, attemptMap, submissionMap) {
  const now = new Date()
  const series = []
  const topicsMap = new Map()

  for (const ga of activities) {
    const gaId = ga.id
    const cell = buildCell(ga, attemptMap.get(key(studentId, gaId)) ?? [], submissionMap.get(key(studentId, gaId)) ?? [], now)

    let sum = 0
    let count = 0
    for (const sid of groupStudentIds) {
      const other = buildCell(ga, attemptMap.get(key(sid, gaId)) ?? [], submissionMap.get(key(sid, gaId)) ?? [], now)
      if (contributesToAverage(other)) {
        sum += averageValueOf(other)
        count += 1
      }
    }
    const groupAverage = count > 0 ? round1(sum / count) : null

    const topicNumber = ga.definition?.topic_number ?? 0
    if (!topicsMap.has(topicNumber)) {
      topicsMap.set(topicNumber, { topicNumber, completed: 0, total: 0, sum: 0 })
    }
    const topic = topicsMap.get(topicNumber)
    topic.total += 1
    if (contributesToAverage(cell)) {
      topic.completed += 1
      topic.sum += averageValueOf(cell)
    }

    series.push({
      activityId: gaId,
      activityNumber: ga.activity_number,
      workdir: ga.workdir,
      title: ga.title,
      topicNumber,
      evaluationType: ga.evaluation_type === "manual" ? "manual" : "automatic",
      activityType: ga.activity_type === "quiz" ? "quiz" : "workshop",
      score: cell.score,
      status: cell.status,
      attempts: cell.attempts,
      lastDate: cell.lastDate ? new Date(cell.lastDate).toISOString() : null,
      dueAt: ga.due_at?.toISOString() ?? null,
      groupAverage,
    })
  }

  const topics = [...topicsMap.values()].map((t) => ({
    topicNumber: t.topicNumber,
    completed: t.completed,
    total: t.total,
    avgScore: t.completed > 0 ? round1(t.sum / t.completed) : null,
  }))

  return { series, topics }
}

/** Rendimiento de un estudiante concreto (vista del docente). */
async function getStudentPerformance({ groupId, studentId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, code: true },
  })
  if (!student) throw new NotFoundError("Estudiante no encontrado")

  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentId, group_id: groupId },
  })
  if (!enrollment) throw new NotFoundError("El estudiante no está inscrito en este grupo")

  const { activities, enrollments, attemptMap, submissionMap } = await loadGroupData(groupId)
  const groupStudentIds = enrollments.map((e) => e.student.id)
  const { series, topics } = buildSeriesForStudent(studentId, activities, groupStudentIds, attemptMap, submissionMap)

  return {
    student: { id: student.id, name: student.name, email: student.email, code: student.code },
    series,
    topics,
    summary: summarizeSeries(series),
  }
}

/** Calificaciones del estudiante autenticado en su grupo activo. */
async function getMyGrades(studentUserId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentUserId, status: "active", group: { archived: false } },
    include: { group: { select: { id: true, name: true } } },
    orderBy: { enrolled_at: "asc" },
  })

  const empty = {
    group: null,
    series: [],
    topics: [],
    summary: { average: null, completed: 0, underReview: 0, overdue: 0, notStarted: 0, total: 0 },
  }
  if (!enrollment) return empty

  const { activities, enrollments, attemptMap, submissionMap } = await loadGroupData(enrollment.group_id)
  const groupStudentIds = enrollments.map((e) => e.student.id)
  const { series, topics } = buildSeriesForStudent(studentUserId, activities, groupStudentIds, attemptMap, submissionMap)

  return {
    group: { id: enrollment.group.id, name: enrollment.group.name },
    series,
    topics,
    summary: summarizeSeries(series),
  }
}

module.exports = { getGroupGradebook, getStudentPerformance, getMyGrades }
