"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { LessonLink } from "@shared/components/lesson-loading"
import { syllabus } from "@shared/lib/content/temario"
import { NeonProgress } from "@shared/components/neon-progress"
import { useCourseProgress } from "@/lib/features/student/course-progress"
import { activities } from "@shared/lib/content/activities"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import { conOrigen } from "@shared/lib/next-url"
import { simulators } from "@shared/lib/content/simulators"
import {
  BurbujaTema,
  EtiquetaTipo,
  VinetaActividad,
  VinetaLeccion,
  VinetaSimulador,
  filaHija,
} from "./marcas-temario"
import type { TopicLessons } from "@shared/lib/content/lessons"

/**
 * Lo que el mapa necesita saber del avance de quien lo mira.
 *
 * Es exactamente lo que devuelve `useCourseProgress` mas el conjunto de
 * actividades aprobadas. Se declara como tipo aparte porque el mapa lo recibe
 * y no lo calcula: quien no tiene matricula —el docente— pasa `null` y el mapa
 * se dibuja sin una sola cifra.
 */
export interface ProgresoTemario {
  lessonTotal: (topicNumber: number) => number
  doneCount: (topicNumber: number) => number
  activityTotal: (topicNumber: number) => number
  activitiesDone: (topicNumber: number) => number
  isTopicDone: (topicNumber: number) => boolean
  isLessonDone: (topicNumber: number, subtopicId: string) => boolean
  cursoPct: number
  temasCompletos: number
  passed: Set<string>
}

/**
 * El mapa del curso: los diez temas con lo que trae cada uno.
 *
 * Con `progreso`, dos numeros que dicen cosas distintas:
 *
 * - Arriba, **temas completos sobre el total**. Es la misma cuenta que hace el
 *   panel lateral y la que ve el docente, asi que un estudiante y su profesor
 *   nunca ven cifras que se contradicen.
 * - En cada tema, **lo hecho sobre su trabajo**: lecciones leidas mas
 *   actividades resueltas. Es lo que ya calcula la tarjeta del inicio.
 *
 * Con `progreso` en `null` es el mismo mapa sin nada de eso: ni porcentajes, ni
 * barras, ni verde. Es la vista del docente, que entra a repasar el temario y no
 * a llevar la cuenta de nadie; ademas sus peticiones de progreso irian sin
 * matricula y volverian vacias.
 *
 * No hay un `Stepper` aunque exista uno en el proyecto: aquel numera pasos en
 * fila y da por hechos los anteriores al actual, y el curso no se recorre asi.
 * Se puede terminar el tema 5 con el 3 a medias.
 */
export function MapaTemario({
  topicLessons,
  progreso,
}: {
  topicLessons: Record<number, TopicLessons>
  progreso: ProgresoTemario | null
}) {
  const [abierto, setAbierto] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      {progreso && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-bold tracking-tight tabular-nums text-foreground">
                {progreso.cursoPct}%
              </p>
              <p className="text-sm text-muted-foreground">del curso completado</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {progreso.temasCompletos} de {syllabus.length} temas completos
            </p>
          </div>
          <NeonProgress value={progreso.cursoPct} className="mt-4 h-1.5" />
        </div>
      )}

      <ol className="space-y-3">
        {syllabus.map((topic) => {
          const leccionesDelTema = topicLessons[topic.number]
          const total = progreso
            ? progreso.lessonTotal(topic.number) + progreso.activityTotal(topic.number)
            : 0
          const hecho = progreso
            ? progreso.doneCount(topic.number) + progreso.activitiesDone(topic.number)
            : 0
          const pct = total > 0 ? Math.round((hecho / total) * 100) : 0
          const completo = progreso ? progreso.isTopicDone(topic.number) : false
          const desplegado = abierto === topic.number

          return (
            <li key={topic.slug} className="rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setAbierto(desplegado ? null : topic.number)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-foreground/[0.03]"
              >
                <BurbujaTema numero={topic.number} activo={desplegado} hecho={completo} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{topic.title}</p>
                  {progreso && total > 0 && <NeonProgress value={pct} className="mt-2 h-1" />}
                </div>

                {progreso && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {total > 0 ? `${hecho}/${total}` : "—"}
                  </span>
                )}
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
                  {(leccionesDelTema?.ids ?? []).map((id) => {
                    const leida = progreso ? progreso.isLessonDone(topic.number, id) : false
                    return (
                      <li key={id}>
                        <LessonLink
                          href={`/curso?tema=${topic.slug}&sub=${id}`}
                          className={filaHija(false, leida)}
                        >
                          <VinetaLeccion hecha={leida} />
                          <span className="truncate">{leccionesDelTema?.titles[id] ?? id}</span>
                        </LessonLink>
                      </li>
                    )
                  })}

                  {/* Las actividades se resuelven contra la matricula de un
                      grupo, asi que fuera del curso no hay ninguna que abrir:
                      el docente las revisa desde el grupo donde las puso. */}
                  {progreso ? (
                    activities
                      .filter((a) => a.topicNumber === topic.number)
                      .map((a) => (
                        // Las actividades se resuelven en la terminal, que en
                        // movil no existe: el enlace llevaria a una pantalla que
                        // no se puede usar.
                        <li key={a.slug} className="hidden md:list-item">
                          <LessonLink
                            href={conOrigen(a.href, "/curso")}
                            className={filaHija(false, progreso.passed.has(a.slug))}
                          >
                            <VinetaActividad hecha={progreso.passed.has(a.slug)} />
                            <span className="truncate">{a.title}</span>
                            <EtiquetaTipo>Actividad</EtiquetaTipo>
                          </LessonLink>
                        </li>
                      ))
                  ) : activities.some((a) => a.topicNumber === topic.number) ? (
                    <li className="hidden md:list-item">
                      <span className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
                        <VinetaActividad />
                        <span className="truncate">
                          Las actividades de este tema se revisan en cada grupo
                        </span>
                        <EtiquetaTipo>Actividad</EtiquetaTipo>
                      </span>
                    </li>
                  ) : null}

                  {/* Los simuladores no llevan vineta de estado: se juegan las
                      veces que haga falta y no cuentan para el progreso, asi
                      que marcarlos como hechos prometeria algo que no pasa. */}
                  {simulators
                    .filter((sim) => sim.topicNumber === topic.number)
                    .map((sim) => (
                      <li key={sim.id} className="hidden md:list-item">
                        <LessonLink href={sim.href} className={filaHija(false, false)}>
                          <VinetaSimulador />
                          <span className="truncate">{sim.title}</span>
                          <EtiquetaTipo>Simulador</EtiquetaTipo>
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

/**
 * El mapa del estudiante: el mismo, con su avance.
 *
 * Los hooks viven aqui y no dentro de `MapaTemario` porque no se pueden llamar
 * a medias: el docente monta el mismo componente y no tiene matricula que
 * consultar.
 */
export function CourseRoadmap({ topicLessons }: { topicLessons: Record<number, TopicLessons> }) {
  const progreso = useCourseProgress(topicLessons)
  const { passed } = usePassedActivities()

  return <MapaTemario topicLessons={topicLessons} progreso={{ ...progreso, passed }} />
}
