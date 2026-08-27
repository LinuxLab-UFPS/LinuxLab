"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { syllabus } from "@shared/lib/content/temario"
import { NeonProgress } from "@shared/components/neon-progress"
import { useCourseProgress } from "@/lib/features/student/course-progress"
import type { TopicLessons } from "@shared/lib/content/lessons"

/**
 * El mapa del curso: los diez temas con lo que llevas hecho en cada uno.
 *
 * Dos numeros que dicen cosas distintas y no hay que confundir:
 *
 * - Arriba, **temas completos sobre el total**. Es la misma cuenta que hace el
 *   panel lateral y la que ve el docente en su tabla, asi que un estudiante y su
 *   profesor nunca ven cifras que se contradicen.
 * - En cada tema, **lo hecho sobre su trabajo**: lecciones leidas mas
 *   actividades resueltas. Es lo que ya calcula la barra de las tarjetas del
 *   inicio.
 *
 * No hay un `Stepper` aqui aunque exista uno en el proyecto: aquel numera pasos
 * en fila y da por hechos los anteriores al actual, y el curso no se recorre
 * asi. Se puede terminar el tema 5 con el 3 a medias.
 */
export function CourseRoadmap({ topicLessons }: { topicLessons: Record<number, TopicLessons> }) {
  const { lessonTotal, doneCount, activityTotal, activitiesDone, isTopicDone } =
    useCourseProgress(topicLessons)

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
        <p className="mt-3 text-xs text-muted-foreground">
          Un tema se cierra cuando has leído todas sus lecciones y resuelto todas sus
          actividades.
        </p>
      </div>

      <ol className="space-y-3">
        {syllabus.map((topic) => {
          const lecciones = lessonTotal(topic.number)
          const actividades = activityTotal(topic.number)
          const total = lecciones + actividades
          const hecho = doneCount(topic.number) + activitiesDone(topic.number)
          const pct = total > 0 ? Math.round((hecho / total) * 100) : 0
          const completo = isTopicDone(topic.number)

          return (
            <li key={topic.slug}>
              <Link
                href={`/curso?tema=${topic.slug}`}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border border-border bg-card p-4",
                  "transition-all duration-300 hover:border-primary/50",
                  "hover:shadow-[var(--neon-glow-strong)]",
                )}
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
                  <p className="truncate text-xs text-muted-foreground">{topic.description}</p>
                  {total > 0 && <NeonProgress value={pct} className="mt-2 h-1" />}
                </div>

                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {total > 0 ? `${hecho}/${total}` : "—"}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
