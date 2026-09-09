const prisma = require("../../prisma/client")
const { runInTransaction } = require("../lib/transaction")
const progressService = require("../services/progressService")
const studentActivityService = require("../services/studentActivityService")
const asyncHandler = require("../utils/asyncHandler")

const recordView = asyncHandler(async (req, res) => {
  const { topicSlug, subtopicId } = req.params

  /* Todas las matriculas activas, no solo la primera.
     El temario es el mismo para todos los grupos, asi que leer una leccion es
     avance en cualquier curso donde el estudiante este inscrito. Antes se
     apuntaba solo en la matricula mas antigua: quien estaba en dos grupos
     mandaba toda su lectura al primero, y el docente del segundo lo veia en
     cero sin que hubiera nada que arreglar del lado del estudiante. */
  const [subtopic, enrollments] = await Promise.all([
    prisma.subtopic.findFirst({
      where: { slug: subtopicId },
      include: { topic: { select: { slug: true } } },
    }),
    prisma.enrollment.findMany({
      where: { student_id: req.user.id, status: "active", group: { status: "active" } },
      orderBy: { created_at: "asc" },
      select: { id: true },
    }),
  ])
  if (!subtopic) {
    res.status(404).json({ error: "Subtema no encontrado", code: "NOT_FOUND" })
    return
  }
  if (subtopic.topic.slug !== topicSlug) {
    res.status(404).json({ error: "Subtema no encontrado en este tema", code: "NOT_FOUND" })
    return
  }
  if (enrollments.length === 0) {
    res.status(409).json({ error: "No hay matrícula activa", code: "NO_ENROLLMENT" })
    return
  }

  await runInTransaction(async (tx) => {
    for (const enrollment of enrollments) {
      await progressService.recordLessonView(tx, enrollment.id, subtopic.id)
    }
  })

  res.status(204).end()
})

const getProgress = asyncHandler(async (req, res) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: req.user.id, status: "active", group: { status: "active" } },
    orderBy: { created_at: "asc" },
    include: { group: { select: { id: true, name: true } } },
  })

  if (!enrollment) {
    res.json({ topicProgress: [], readKeys: [], group: null, activities: [] })
    return
  }

  const [topicProgress, lessonViews, groupActivities] = await Promise.all([
    prisma.topicProgress.findMany({
      where: { enrollment_id: enrollment.id },
      include: { topic: { select: { order_number: true, title: true } } },
    }),
    prisma.lessonView.findMany({
      where: { enrollment_id: enrollment.id },
      include: { subtopic: { select: { slug: true, topic: { select: { order_number: true } } } } },
    }),
    studentActivityService.listMine(req.user.id),
  ])

  const readKeys = lessonViews.map(
    (lv) => `${lv.subtopic.topic.order_number}/${lv.subtopic.slug}`,
  )

  res.json({
    topicProgress: topicProgress.map((tp) => ({
      topicId: tp.topic_id,
      topicNumber: tp.topic.order_number,
      title: tp.topic.title,
      completed: tp.completed,
      completedAt: tp.completed_at?.toISOString() ?? null,
    })),
    readKeys,
    group: { id: enrollment.group.id, name: enrollment.group.name },
    activities: groupActivities.activities,
  })
})

module.exports = { recordView, getProgress }
