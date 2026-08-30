"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { LessonLink } from "@shared/components/lesson-loading"
import { syllabus } from "@shared/lib/content/temario"
import { NeonProgress } from "@shared/components/neon-progress"
import { useCourseProgress } from "@/lib/features/student/course-progress"
import { activities } from "@shared/lib/content/activities"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import type { TopicLessons } from "@shared/lib/content/lessons"

/** Un punto verde si la pieza esta hecha, hueco si no. */
function Punto({ hecho }: { hecho: boolean }) {
  return (
    <span
      className={cn(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        hecho ? "bg-emerald-500" : "border border-muted-foreground/40",
      )}
    />
  )
}

/**
 * El mapa del curso: los diez temas con lo que llevas hecho en cada uno.
 *
 * Dos numeros que dicen cosas distintas:
 *
 * - Arriba, **temas completos sobre el total**. Es la misma cuenta que hace el
 *   panel lateral y la que ve el docente, asi que un estudiante y su profesor
 *   nunca ven cifras que se contradicen.
 * - En cada tema, **lo hecho sobre su trabajo**: lecciones leidas mas
 *   actividades resueltas. Es lo que ya calcula la tarjeta del inicio.
 *
 * No hay un `Stepper` aunque exista uno en el proyecto: aquel numera pasos en
 * fila y da por hechos los anteriores al actual, y el curso no se recorre asi.
 * Se puede terminar el tema 5 con el 3 a medias.
 */
export function CourseRoadmap({ topicLessons }: { topicLessons: Record<number, TopicLessons> }) {
  const { lessonTotal, doneCount, activityTotal, activitiesDone, isTopicDone, isLessonDone } =
    useCourseProgress(topicLessons)
  const { passed } = usePassedActivities()
  const [abierto, setAbierto] = useState<number | null>(null)

  const temasHechos = syllabus.filter((t) => isTopicDone(t.number)).length
  const pctGeneral = Math.round((temasHechos / syllabus.length) * 100)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-4xl font-bold text-foreground">{pctGeneral}%</p>
            <p className="text-sm text-muted-foreground">del curso completado</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {temasHechos} de {syllabus.length} temas
          </p>
        </div>
        <NeonProgress value={pctGeneral} className="mt-4 h-1.5" />
      </div>

      <ol className="space-y-3">
        {syllabus.map((topic) => {
          const leccionesDelTema = topicLessons[topic.number]
          const total = lessonTotal(topic.number) + activityTotal(topic.number)
          const hecho = doneCount(topic.number) + activitiesDone(topic.number)
          const pct = total > 0 ? Math.round((hecho / total) * 100) : 0
          const completo = isTopicDone(topic.number)
          const desplegado = abierto === topic.number

          return (
            <li key={topic.slug} className="rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setAbierto(desplegado ? null : topic.number)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-foreground/[0.03]"
              >
                {/* Mismo lenguaje que el panel lateral: verde cuando esta hecho,
                    neutro cuando queda trabajo. */}
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                    completo
                      ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {completo ? <Check className="h-4 w-4" /> : topic.number}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{topic.title}</p>
                  {total > 0 && <NeonProgress value={pct} className="mt-2 h-1" />}
                </div>

                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {total > 0 ? `${hecho}/${total}` : "—"}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    desplegado && "rotate-180",
                  )}
                />
              </button>

              {/* El desglose, con el nombre de cada pieza: una lista de "Lección"
                  repetida no dice cual falta. Los enlaces van por `LessonLink`,
                  que es el que enciende el velo de carga. */}
              {desplegado && (
                <ul className="space-y-1 border-t border-border px-4 py-3">
                  {(leccionesDelTema?.ids ?? []).map((id) => (
                    <li key={id}>
                      <LessonLink
                        href={`/curso?tema=${topic.slug}&sub=${id}`}
                        className="flex items-center gap-2 rounded px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                      >
                        <Punto hecho={isLessonDone(topic.number, id)} />
                        <span className="truncate">{leccionesDelTema?.titles[id] ?? id}</span>
                      </LessonLink>
                    </li>
                  ))}
                  {activities
                    .filter((a) => a.topicNumber === topic.number)
                    .map((a) => (
                      <li key={a.slug}>
                        <LessonLink
                          href={a.href}
                          className="flex items-center gap-2 rounded px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                        >
                          <Punto hecho={passed.has(a.slug)} />
                          <span className="truncate">{a.title}</span>
                          <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide opacity-70">
                            Actividad
                          </span>
                        </LessonLink>
                      </li>
                    ))}
                </ul>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
