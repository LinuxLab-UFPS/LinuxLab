"use client"

import { useCallback } from "react"
import { useLessonProgress } from "@/lib/features/student/progress"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import { activities } from "@shared/lib/content/activities"
import type { TopicLessons } from "@shared/lib/content/lessons"
import { syllabus } from "@shared/lib/content/temario"

/**
 * How far the student actually got through the course.
 *
 * A plain lesson counts as done once it has been read. One that carries a check
 * counts only when the check passes: opening the page and scrolling past the
 * button is not doing the exercise, and a topic that ends in one should not go
 * green until the laboratory says so.
 *
 * Y un tema no está terminado mientras le queden actividades. Antes solo
 * contaban las lecciones, así que se podía cerrar un tema entero sin haber
 * resuelto nada de lo que propone: las actividades son el trabajo del tema, no
 * un extra.
 */
export function useCourseProgress(lessons: Record<number, TopicLessons>, activo = true) {
  const { isRead } = useLessonProgress()
  const { passed } = usePassedActivities(activo)

  const isLessonDone = useCallback(
    (topicNumber: number, subtopicId: string) => {
      if (!isRead(topicNumber, subtopicId)) return false
      const slug = lessons[topicNumber]?.checks[subtopicId]
      return slug ? passed.has(slug) : true
    },
    [isRead, passed, lessons],
  )

  const lessonTotal = useCallback(
    (topicNumber: number) => lessons[topicNumber]?.ids.length ?? 0,
    [lessons],
  )

  const doneCount = useCallback(
    (topicNumber: number) =>
      (lessons[topicNumber]?.ids ?? []).filter((id) => isLessonDone(topicNumber, id)).length,
    [lessons, isLessonDone],
  )

  const topicActivities = useCallback(
    (topicNumber: number) => activities.filter((a) => a.topicNumber === topicNumber),
    [],
  )

  const activitiesDone = useCallback(
    (topicNumber: number) => topicActivities(topicNumber).filter((a) => passed.has(a.slug)).length,
    [topicActivities, passed],
  )

  const isTopicDone = useCallback(
    (topicNumber: number) => {
      const total = lessonTotal(topicNumber)
      if (total === 0 || doneCount(topicNumber) < total) return false
      const propuestas = topicActivities(topicNumber)
      return activitiesDone(topicNumber) >= propuestas.length
    },
    [lessonTotal, doneCount, topicActivities, activitiesDone],
  )

  /**
   * El avance del curso, contando piezas y no temas enteros.
   *
   * Antes era `temasCompletos / 10`, y como un tema solo cuenta cuando estan
   * todas sus lecciones Y todas sus actividades, leer cuatro de cinco
   * lecciones daba exactamente 0%. Con diez temas, cualquier avance real
   * redondeaba a cero y la barra parecia rota.
   *
   * `isTopicDone` no cambia: el tema sigue poniendose verde solo cuando esta
   * entero, que es lo que decide la certificacion.
   */
  const cursoTotal = syllabus.reduce(
    (suma, t) => suma + lessonTotal(t.number) + topicActivities(t.number).length,
    0,
  )
  const cursoHecho = syllabus.reduce(
    (suma, t) => suma + doneCount(t.number) + activitiesDone(t.number),
    0,
  )
  const cursoPct = cursoTotal > 0 ? Math.round((cursoHecho / cursoTotal) * 100) : 0

  return {
    isLessonDone,
    lessonTotal,
    doneCount,
    isTopicDone,
    activityTotal: useCallback((n: number) => topicActivities(n).length, [topicActivities]),
    activitiesDone,
    cursoPct,
    cursoHecho,
    cursoTotal,
    temasCompletos: syllabus.filter((t) => isTopicDone(t.number)).length,
  }
}
