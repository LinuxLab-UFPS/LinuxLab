const prisma = require("../../prisma/client")
const { AppError } = require("../lib/errors")
const accessService = require("./accessService")

function round1(value) {
  return Math.round(value * 10) / 10
}

const PASSING_SCORE = 60

/**
 * La regla de certificacion, en un solo sitio: la consume la vista previa y la
 * transaccion que finaliza el grupo. El curso se completa con dos dimensiones,
 * cada una medida con el instrumento justo:
 *
 * - Temario (todos los temas): lecturas, comprobaciones y actividades del banco
 *   aprobadas. Todo es de reintento ilimitado, asi que exigir el 100% es justo.
 * - Actividades del docente: la dimension con restricciones (quiz de intento
 *   unico, fechas de cierre, revision manual de entrega unica). Se mide con la
 *   definitiva: promedio simple del ultimo intento de cada actividad del banco
 *   y de cada actividad habilitada del docente; basta con >= 60, el mismo
 *   umbral con el que se aprueba una actividad.
 *
 * Sin actividades que promediar, la definitiva no aplica y manda el temario.
 */
async function finalizationSummary({ groupId, teacherUserId, role, tx = prisma }) {
  const group = await accessService.ensureGroupAccess({ groupId, teacherUserId, role, tx })
  if (group.status !== "active") {
    throw new AppError("El grupo ya no está activo", 409, "CONFLICT")
  }
  return computeGroupSummary(group, tx)
}

/**
 * El calculo puro, sin guard de acceso ni de estado: tambien lo usa el acta de
 * un grupo ya finalizado, cuyos datos quedaron congelados al emitir.
 */
async function computeGroupSummary(group, tx = prisma) {
  const groupId = group.id

  const [topics, bankActivities, enrollments, groupActivities] = await Promise.all([
    tx.topic.findMany({ select: { id: true } }),
    tx.topicActivity.findMany({ where: { kind: "activity" }, select: { id: true } }),
    tx.enrollment.findMany({
      where: { group_id: groupId },
      include: { student: { select: { code: true, user: { select: { id: true, name: true } } } } },
      orderBy: { created_at: "asc" },
    }),
    tx.groupActivity.findMany({
      where: { group_id: groupId, enabled: true },
      select: { id: true, title: true, evaluation_type: true },
    }),
  ])
  const topicsTotal = topics.length
  const enrollmentIds = enrollments.map((e) => e.id)

  const [topicProgress, topicSubmissions, groupSubmissions] = await Promise.all([
    tx.topicProgress.findMany({
      where: { enrollment_id: { in: enrollmentIds }, completed: true },
      select: { enrollment_id: true, topic_id: true },
    }),
    tx.topicSubmission.findMany({
      where: { enrollment_id: { in: enrollmentIds }, topicActivity: { kind: "activity" } },
      select: { enrollment_id: true, topic_activity_id: true, score: true, created_at: true },
    }),
    tx.groupSubmission.findMany({
      where: { enrollment_id: { in: enrollmentIds } },
      select: {
        enrollment_id: true,
        group_activity_id: true,
        score: true,
        created_at: true,
        autoDetail: { select: { submission_id: true } },
        manualDetail: { select: { submission_id: true } },
      },
    }),
  ])

  const laterOf = (a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b)

  const completedTopics = new Map() // enrollmentId -> Set<topicId>
  for (const tp of topicProgress) {
    if (!completedTopics.has(tp.enrollment_id)) completedTopics.set(tp.enrollment_id, new Set())
    completedTopics.get(tp.enrollment_id).add(tp.topic_id)
  }

  const bankLatest = new Map() // "enrollmentId:activityId" -> ultimo intento del banco
  for (const ts of topicSubmissions) {
    const key = `${ts.enrollment_id}:${ts.topic_activity_id}`
    const prev = bankLatest.get(key)
    bankLatest.set(key, prev ? laterOf(prev, ts) : ts)
  }

  const enabledIds = new Set(groupActivities.map((ga) => ga.id))
  const autoLatest = new Map() // "enrollmentId:activityId" -> ultimo intento automatico
  const manualLatest = new Map() // idem, ultima entrega manual (calificada o no)
  for (const gs of groupSubmissions) {
    if (!enabledIds.has(gs.group_activity_id)) continue
    const map = gs.autoDetail ? autoLatest : gs.manualDetail ? manualLatest : null
    if (!map) continue
    const key = `${gs.enrollment_id}:${gs.group_activity_id}`
    const prev = map.get(key)
    map.set(key, prev ? laterOf(prev, gs) : gs)
  }

  const rows = enrollments.map((enrollment) => {
    const done = completedTopics.get(enrollment.id)
    const topicsCompleted = done ? done.size : 0

    const pendingManual = []
    const scores = []
    for (const ta of bankActivities) {
      scores.push(bankLatest.get(`${enrollment.id}:${ta.id}`)?.score ?? 0)
    }
    for (const ga of groupActivities) {
      if (ga.evaluation_type === "manual") {
        const latest = manualLatest.get(`${enrollment.id}:${ga.id}`)
        const score = latest?.score ?? null
        scores.push(score ?? 0)
        if (latest && score === null) pendingManual.push(ga.title)
      } else {
        scores.push(autoLatest.get(`${enrollment.id}:${ga.id}`)?.score ?? 0)
      }
    }
    const definitive = scores.length > 0 ? round1(scores.reduce((a, b) => a + b, 0) / scores.length) : null

    const topicsOk = topicsTotal > 0 && topicsCompleted === topicsTotal
    const definitiveOk = definitive === null || definitive >= PASSING_SCORE

    const motivos = []
    if (!topicsOk) motivos.push(`Temas ${topicsCompleted}/${topicsTotal}`)
    if (!definitiveOk) motivos.push(`Definitiva ${definitive} < ${PASSING_SCORE}`)

    return {
      enrollmentId: enrollment.id,
      studentId: enrollment.student.user.id,
      name: enrollment.student.user.name,
      code: enrollment.student.code ?? null,
      topicsCompleted,
      topicsTotal,
      progress: topicsTotal > 0 ? Math.round((topicsCompleted / topicsTotal) * 100) : 0,
      definitive,
      eligible: topicsOk && definitiveOk,
      motivo: motivos.length > 0 ? motivos.join(" · ") : null,
      pendingManual,
    }
  })

  return {
    group: { id: group.id, name: group.name, status: group.status },
    students: rows,
    summary: { eligibleCount: rows.filter((r) => r.eligible).length, total: rows.length },
  }
}

module.exports = { finalizationSummary, computeGroupSummary, PASSING_SCORE }
