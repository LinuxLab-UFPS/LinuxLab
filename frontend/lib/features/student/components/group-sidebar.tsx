"use client"

import { useState } from "react"
import Link from "next/link"
import { LessonLink } from "@shared/components/lesson-loading"
import { CheckCircle2, ChevronRight, Hand, Map } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { simulators } from "@shared/lib/content/simulators"
import {
  BurbujaTema,
  EtiquetaTipo,
  VinetaLeccion,
  VinetaSimulador,
  filaHija,
} from "./marcas-temario"
import { syllabus } from "@shared/lib/content/temario"
import { bienvenida } from "@shared/lib/content/bienvenida"
import { NeonProgress } from "@shared/components/neon-progress"
import { useCourseProgress } from "@/lib/features/student/course-progress"
import type { TopicLessons } from "@shared/lib/content/lessons"

interface GroupSidebarProps {
  activeTopicSlug: string
  activeSubtopicId?: string
  /** Lessons per topic and which of them carry a check, for the completion state. */
  topicLessons: Record<number, TopicLessons>
  groupName?: string
  /**
   * Quien navega el temario sin cursarlo: el docente. Se pinta la misma lista,
   * pero sin barra de progreso ni marcas de completado, porque no hay avance
   * suyo que contar y las cifras vacias se leerian como un cero real.
   */
  soloLectura?: boolean
  /** Para ajustar el marco a la capa que lo contiene: flotante o modal. */
  className?: string
  /**
   * La version del panel flotante: sin titulo ni progreso, que ya los pone la
   * barra de la que cuelga, y con filas mas apretadas.
   *
   * Las dos cosas son por el alto. Con un tema de cinco lecciones y simulador
   * desplegado la lista pedia 701px, y en un portatil de 1366x768 bajo la barra
   * quedan 580: el tema diez no se veia. Filas de 32 y no de 40 la dejan en unos
   * 550. En el modal de movil no se aprieta nada, porque ahi se toca con el dedo
   * y 40px es lo que pide un blanco tactil.
   */
  compacto?: boolean
}

/**
 * Clean group contents panel (devops-daily style): a self-outlined card, the
 * same color as the background, with a home/title nav on top, the module list
 * (numbered; done ones get a green check and dimmer text), and overall progress
 * at the bottom.
 *
 * Solo la tarjeta, sin la columna que la sostiene: asi la reusan tanto la barra
 * lateral de escritorio como el desplegable de movil.
 */
export function PanelContenidos({
  activeTopicSlug,
  activeSubtopicId,
  topicLessons,
  groupName,
  soloLectura = false,
  className,
  compacto = false,
}: GroupSidebarProps) {
  const {
    isLessonDone,
    isTopicDone,
    cursoPct: overallPct,
    temasCompletos: doneCount,
  } = useCourseProgress(topicLessons, !soloLectura)

  /* El tema desplegado. Uno solo a la vez, a proposito: con varios abiertos el
     panel crecia y volvia a hacer falta desplazar la lista para llegar al tema
     diez, que es justo lo que se habia quitado. Arranca en el tema de la
     leccion que se esta leyendo, que es el que casi siempre se quiere ver. */
  const [desplegadoEn, setDesplegadoEn] = useState<string | null>(activeTopicSlug)

  return (
    /* `w-full` y `min-w-0`: la tarjeta se ajusta a su columna y no al texto que
       lleva dentro. Sin esto el panel cambiaba de ancho segun el tema abierto,
       porque una leccion de nombre largo lo estiraba. */
    <div
      className={cn(
        "flex w-full min-w-0 max-h-full flex-col overflow-hidden rounded-xl border border-black/15 bg-background shadow-md dark:border-border dark:shadow-none",
        className,
      )}
    >
      {/* Solo el titulo: el atajo al inicio se mudo a la barra, donde esta a la
          vista siempre y no solo con el indice abierto. */}
      {!compacto && (
        <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {groupName ?? "Contenidos del curso"}
          </h2>
        </div>
      )}

      {/* El progreso, arriba del todo: es lo primero que se quiere saber al
          abrir el curso, y al pie de una lista larga quedaba fuera de vista. */}
      {!soloLectura && !compacto && (
        <LessonLink
          href={`/curso?tema=${bienvenida.slug}&sub=roadmap`}
          className="shrink-0 border-b border-border px-4 py-3 transition-colors hover:bg-secondary"
        >
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tu progreso</span>
            <span className="tabular-nums text-foreground">
              {doneCount}/{syllabus.length}
            </span>
          </div>
          <NeonProgress value={overallPct} className="h-1" />
        </LessonLink>
      )}

      {/* Module list */}
      <nav className="no-scrollbar min-h-0 overflow-y-auto p-2">
        <ul className={compacto ? "space-y-0" : "space-y-0.5"}>
          {/* La bienvenida va aparte y sin numero: es lo que hay antes de
              empezar, no el tema 1. Sus paginas no puntuan. */}
          {bienvenida.pages.map((pagina) => {
            const activa =
              activeTopicSlug === bienvenida.slug && activeSubtopicId === pagina.id
            return (
              <li key={pagina.id}>
                <Link
                  href={`/curso?tema=${bienvenida.slug}&sub=${pagina.id}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors",
                    compacto && "py-1",
                    activa ? "bg-primary/10" : "hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      activa ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {pagina.kind === "roadmap" ? (
                      <Map className="h-3.5 w-3.5" />
                    ) : (
                      <Hand className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "flex-1 truncate text-sm",
                      activa ? "font-medium text-foreground" : "text-foreground",
                    )}
                  >
                    {pagina.title}
                  </span>
                </Link>
              </li>
            )
          })}

          <li aria-hidden className={cn("border-t border-border", compacto ? "my-1" : "my-1.5")} />

          {syllabus.map((topic) => {
            const isActive = topic.slug === activeTopicSlug
            const done = isTopicDone(topic.number)
            /* Las lecciones salen de `topicLessons`, que trae las de todos los
               temas y no solo las del abierto: sin eso no habria que desplegar
               en los demas. Los simuladores no estan aqui, van aparte. */
            const temario = topicLessons[topic.number]
            const lecciones = temario
              ? temario.ids.map((id) => ({ id, title: temario.titles[id] ?? id }))
              : []
            const desplegado = desplegadoEn === topic.slug
            const claseFila = cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
              compacto && "py-1",
              isActive ? "bg-secondary/70" : "hover:bg-secondary/40",
            )
            const fila = (
              <>
                <BurbujaTema numero={topic.number} activo={isActive} hecho={done} />
                <span
                  className={cn(
                    "flex-1 truncate text-sm",
                    done && !isActive
                      ? "text-emerald-500/80 line-through"
                      : isActive
                        ? "font-medium text-foreground"
                        : "text-foreground",
                  )}
                >
                  {topic.title}
                </span>
                {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                {lecciones.length > 0 && (
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      desplegado && "rotate-90",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                )}
              </>
            )

            return (
              <li key={topic.slug}>
                {/* El tema despliega y son sus lecciones las que cambian de
                    pagina: pulsar un tema para ver que trae no deberia sacar al
                    lector de donde estaba. Un tema sin lecciones no tiene nada
                    que desplegar, asi que ese si navega directo, igual que la
                    guia y la ruta de aprendizaje. */}
                {lecciones.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setDesplegadoEn(desplegado ? null : topic.slug)}
                    aria-expanded={desplegado}
                    className={claseFila}
                  >
                    {fila}
                  </button>
                ) : (
                  <LessonLink href={`/curso?tema=${topic.slug}`} className={claseFila}>
                    {fila}
                  </LessonLink>
                )}

                {desplegado && lecciones.length > 0 && (
                  <ul
                    className={cn(
                      "ml-6 mt-0.5 border-l border-border pl-3",
                      compacto ? "space-y-0" : "space-y-0.5",
                    )}
                  >
                    {lecciones.map((sub) => {
                      const read = isLessonDone(topic.number, sub.id)
                      const activeSub = sub.id === activeSubtopicId
                      return (
                        <li key={sub.id}>
                          <LessonLink
                            href={`/curso?tema=${topic.slug}&sub=${sub.id}`}
                            className={cn(filaHija(activeSub, read), compacto && "py-1")}
                          >
                            <VinetaLeccion hecha={read} />
                            {/* `min-w-0` para que el nombre largo se corte en
                                vez de estirar el panel. */}
                            <span className="min-w-0 truncate">{sub.title}</span>
                          </LessonLink>
                        </li>
                      )
                    })}

                    {/* Los simuladores del tema, si tiene. Las actividades NO:
                        hay varias por tema y estiraban tanto la lista que el
                        tema siguiente quedaba fuera de alcance del raton. Estan
                        en el mapa del curso, que es donde se abarcan de un
                        vistazo. */}
                    {simulators
                      .filter((sim) => sim.topicNumber === topic.number)
                      .map((sim) => (
                        <li key={sim.id}>
                          <LessonLink href={sim.href} className={cn(filaHija(false, false), compacto && "py-1")}>
                            <VinetaSimulador />
                            <span className="min-w-0 truncate">{sim.title}</span>
                            <EtiquetaTipo>Simulador</EtiquetaTipo>
                          </LessonLink>
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

    </div>
  )
}
