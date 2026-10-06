const prisma = require("../../prisma/client")
const accessService = require("./accessService")
const { finalScore } = require("../utils/finalScore")

/** La nota con la que se aprueba una actividad, del curso o del docente. */
const PASSING_SCORE = 60

function round1(value) {
  return Math.round(value * 10) / 10
}

function formatDate(value) {
  return value ? new Date(value).toISOString() : null
}

/**
 * Las piezas de un tema para una matricula: que subtemas cuentan como hechos
 * (vistos y con sus checks aprobados) y cuantas actividades del banco aprobo.
 * La comparten la tabla del docente y la regla de certificacion, para que el
 * progreso que decide el certificado sea el mismo que el docente ve en la fila.
 */
function topicPieces(topic, viewed, passed) {
  const activitiesBySubtopic = new Map() // subtopicId -> activityIds[]
  for (const a of topic.activities) {
    if (a.subtopic_id != null) {
      if (!activitiesBySubtopic.has(a.subtopic_id)) activitiesBySubtopic.set(a.subtopic_id, [])
      activitiesBySubtopic.get(a.subtopic_id).push(a.id)
    }
  }

  let touched = 0
  // Cuales, y no solo cuantos: la ficha del estudiante lista sus lecciones
  // una por una, y un conteo no dice cual le falta. Misma regla que el
  // conteo (visto y con sus checks aprobados), asi que la lista y la cifra
  // de al lado no se pueden contradecir.
  const hechos = []
  for (const sub of topic.subtopics) {
    if (!viewed.has(sub.id)) continue
    touched++
    const acts = activitiesBySubtopic.get(sub.id)
    if (acts && acts.some((id) => !passed.has(id))) continue
    hechos.push(sub.id)
  }

  // Las actividades sueltas del tema (las del banco, `kind: "activity"`)
  // son trabajo del tema igual que sus lecciones, asi que cuentan como una
  // pieza cada una. Las de `kind: "check"` no: esas van pegadas a un
  // subtema y ya se exigen arriba para darlo por leido.
  const propuestas = topic.activities.filter((a) => a.kind === "activity")
  const propuestasHechas = propuestas.filter((a) => passed.has(a.id)).length

  return {
    hechos,
    touched,
    piezasHechas: hechos.length + propuestasHechas,
    piezasTotal: topic.subtopics.length + propuestas.length,
  }
}

/**
 * Las actividades habilitadas del docente como piezas del curso: cada una suma
 * una al total, y cuenta como hecha cuando la nota final del estudiante llega
 * a 60 (ultimo intento en las automaticas, la nota del docente en las
 * manuales; una entrega sin calificar todavia no cuenta). Es la misma nota que
 * el estudiante ve en su lista de actividades.
 */
async function teacherActivityPieces(groupId, enrollmentIds, tx = prisma) {
  const groupActivities = await tx.groupActivity.findMany({
    where: { group_id: groupId, enabled: true },
    select: { id: true, evaluation_type: true },
  })
  const doneByEnrollment = new Map() // enrollmentId -> n actividades aprobadas
  if (groupActivities.length === 0 || enrollmentIds.length === 0) {
    return { total: groupActivities.length, doneByEnrollment }
  }

  const submissions = await tx.groupSubmission.findMany({
    where: {
      enrollment_id: { in: enrollmentIds },
      group_activity_id: { in: groupActivities.map((ga) => ga.id) },
    },
    select: {
      enrollment_id: true,
      group_activity_id: true,
      score: true,
      created_at: true,
      autoDetail: { select: { submission_id: true } },
      manualDetail: { select: { submission_id: true } },
    },
  })
  const byKey = new Map() // "enrollmentId:activityId" -> intentos
  for (const s of submissions) {
    const key = `${s.enrollment_id}:${s.group_activity_id}`
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key).push(s)
  }

  for (const enrollmentId of enrollmentIds) {
    let done = 0
    for (const ga of groupActivities) {
      const subs = byKey.get(`${enrollmentId}:${ga.id}`) ?? []
      const manual = ga.evaluation_type === "manual"
      const own = subs.filter((s) => (manual ? s.manualDetail : s.autoDetail))
      const score = manual
        ? (own.reduce((a, b) => (!a || new Date(b.created_at) > new Date(a.created_at) ? b : a), null)
            ?.score ?? 0)
        : finalScore(own)
      if (score >= PASSING_SCORE) done++
    }
    doneByEnrollment.set(enrollmentId, done)
  }
  return { total: groupActivities.length, doneByEnrollment }
}

/**
 * El % de progreso de cada matricula (Map enrollmentId -> 0..100), con la misma
 * cuenta de `getGroupProgress` pero sin el resto de la ficha. Lo usa la
 * finalizacion, que corre dentro de su transaccion.
 */
async function computePieceProgress(groupId, enrollmentIds, tx = prisma) {
  const [topics, lessonViews, passedSubmissions, teacherPieces] = await Promise.all([
    tx.topic.findMany({
      select: {
        subtopics: { select: { id: true } },
        activities: { select: { id: true, kind: true, subtopic_id: true } },
      },
    }),
    tx.lessonView.findMany({
      where: { enrollment_id: { in: enrollmentIds } },
      select: { enrollment_id: true, subtopic_id: true },
    }),
    tx.topicSubmission.findMany({
      where: { enrollment_id: { in: enrollmentIds }, passed: true },
      select: { enrollment_id: true, topic_activity_id: true },
    }),
    teacherActivityPieces(groupId, enrollmentIds, tx),
  ])

  const viewedBy = new Map()
  const passedBy = new Map()
  const addToSet = (map, key, value) => {
    if (!map.has(key)) map.set(key, new Set())
    map.get(key).add(value)
  }
  for (const lv of lessonViews) addToSet(viewedBy, lv.enrollment_id, lv.subtopic_id)
  for (const ts of passedSubmissions) addToSet(passedBy, ts.enrollment_id, ts.topic_activity_id)

  const result = new Map()
  for (const enrollmentId of enrollmentIds) {
    const viewed = viewedBy.get(enrollmentId) ?? new Set()
    const passed = passedBy.get(enrollmentId) ?? new Set()
    let hechas = teacherPieces.doneByEnrollment.get(enrollmentId) ?? 0
    let total = teacherPieces.total
    for (const topic of topics) {
      const p = topicPieces(topic, viewed, passed)
      hechas += p.piezasHechas
      total += p.piezasTotal
    }
    result.set(enrollmentId, total > 0 ? Math.round((hechas / total) * 100) : 0)
  }
  return result
}

/**
 * Progreso de contenidos de los estudiantes de un grupo.
 *
 * El porcentaje cuenta **piezas**: cada subtema leido, cada actividad del banco
 * aprobada y cada actividad habilitada del docente aprobada suma una, sobre el
 * total de piezas del curso. Antes contaba temas
 * enteros, y como un tema solo esta completo cuando estan TODOS sus subtemas y
 * TODAS sus actividades, el estudiante que habia leido cuatro lecciones de cinco
 * en tres temas distintos salia con un 0% redondo. El docente lo leia como que
 * no habia entrado nunca.
 *
 * Es la misma cuenta que hace `course-progress.ts` del lado del estudiante, a
 * proposito: el numero que ve el docente en la fila y el que ve el estudiante en
 * su mapa tienen que ser el mismo, o uno de los dos esta mintiendo.
 *
 * `topicStatus` no cambia: un tema sigue poniendose en verde solo cuando esta
 * entero, que es lo que decide la certificacion.
 *
 * El total se calcula siempre contra el temario completo y no contra lo que un
 * estudiante toco, para que las barras sean comparables entre estudiantes.
 */
async function getGroupProgress({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const [topics, enrollments] = await Promise.all([
    prisma.topic.findMany({
      select: {
        order_number: true,
        title: true,
        subtopics: { select: { id: true, title: true, order_number: true } },
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

  const [topicProgress, topicSubmissions, lessonViews, groupSubmissions, groupActivities, teacherPieces] =
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
      teacherActivityPieces(groupId, enrollmentIds),
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
      const { hechos, touched, piezasHechas, piezasTotal } = topicPieces(topic, viewed, passed)
      perTopic.set(topic.order_number, {
        completed: hechos.length,
        total: topic.subtopics.length,
        hechos,
        touched,
        piezasHechas,
        piezasTotal,
      })
    }
    perTopicByEnrollment.set(enrollment.id, perTopic)
  }

  const now = new Date()
  const DAY = 24 * 60 * 60 * 1000
  const activeWindow = 5 * 60 * 1000

  const totalTopics = topicsOrdered.length
  const piezasDelCurso = topicsOrdered.reduce(
    (suma, t) => suma + t.subtopics.length + t.activities.filter((a) => a.kind === "activity").length,
    teacherPieces.total,
  )

  const rows = enrollments.map((e) => {
    const studentUserId = e.student.user.id
    const completed = completedByEnrollment.get(e.id) ?? new Set()
    const perTopic = perTopicByEnrollment.get(e.id) ?? new Map()

    const topicStatus = {}
    const topicProgress = []
    for (const topic of topicsOrdered) {
      const n = topic.order_number
      const d = perTopic.get(n) ?? { completed: 0, total: 0, touched: 0, piezasHechas: 0, hechos: [] }
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
        doneSubtopics: d.hechos,
      })
    }

    const lastActivity = lastActivityByEnrollment.get(e.id)
    const piezasHechas = topicsOrdered.reduce(
      (suma, t) => suma + (perTopic.get(t.order_number)?.piezasHechas ?? 0),
      teacherPieces.doneByEnrollment.get(e.id) ?? 0,
    )
    const progress = piezasDelCurso > 0 ? Math.round((piezasHechas / piezasDelCurso) * 100) : 0

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
    /* Los nombres de las lecciones, en la raiz y no en cada fila: son los mismos
       para todo el grupo, y repetirlos por estudiante multiplicaba el tamano de
       la respuesta por el numero de matriculados sin decir nada nuevo. */
    topics: topicsOrdered.map((t) => ({
      topicNumber: t.order_number,
      title: t.title,
      subtopics: [...t.subtopics]
        .sort((a, b) => a.order_number - b.order_number)
        .map((sub) => ({ id: sub.id, title: sub.title })),
    })),
    rows,
  }
}

module.exports = { getGroupProgress, computePieceProgress, PASSING_SCORE }