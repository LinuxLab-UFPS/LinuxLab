"use client"

import Link from "next/link"
import { LessonLink } from "@shared/components/lesson-loading"
import { CheckCircle2, ChevronRight, Circle, Hand, Home, Map } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { syllabus } from "@shared/lib/content/temario"
import { bienvenida } from "@shared/lib/content/bienvenida"
import { NeonProgress } from "@shared/components/neon-progress"
import { useCourseProgress } from "@/lib/features/student/course-progress"
import type { LessonSubtopic } from "@/lib/models/content"
import type { TopicLessons } from "@shared/lib/content/lessons"

interface GroupSidebarProps {
  activeTopicSlug: string
  activeSubtopicId?: string
  /** Subtopics of the active topic, when it has published content. */
  contentSubtopics?: LessonSubtopic[]
  /** Lessons per topic and which of them carry a check, for the completion state. */
  topicLessons: Record<number, TopicLessons>
  groupName?: string
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
  contentSubtopics,
  topicLessons,
  groupName,
}: GroupSidebarProps) {
  const { isLessonDone, isTopicDone } = useCourseProgress(topicLessons)

  const doneCount = syllabus.filter((t) => isTopicDone(t.number)).length
  const overallPct = Math.round((doneCount / syllabus.length) * 100)

  return (
    /* `w-full` y `min-w-0`: la tarjeta se ajusta a su columna y no al texto que
       lleva dentro. Sin esto el panel cambiaba de ancho segun el tema abierto,
       porque una leccion de nombre largo lo estiraba. */
    <div className="flex w-full min-w-0 max-h-full flex-col overflow-hidden rounded-xl border border-black/15 bg-background shadow-md dark:border-border dark:shadow-none">
      {/* Nav: home + title */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
        <Link
          href="/inicio"
          title="Volver al inicio"
          aria-label="Volver al inicio"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Home className="h-4 w-4" />
        </Link>
        <h2 className="truncate text-sm font-semibold text-foreground">
          {groupName ?? "Contenidos del curso"}
        </h2>
      </div>

      {/* El progreso, arriba del todo: es lo primero que se quiere saber al
          abrir el curso, y al pie de una lista larga quedaba fuera de vista. */}
      <LessonLink
        href={`/curso?tema=${bienvenida.slug}&sub=roadmap`}
        className="shrink-0 border-b border-border px-4 py-3 transition-colors hover:bg-secondary"
      >
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Tu progreso</span>
          <span className="font-mono tabular-nums text-foreground">
            {doneCount}/{syllabus.length}
          </span>
        </div>
        <NeonProgress value={overallPct} className="h-1" />
      </LessonLink>

      {/* Module list */}
      <nav className="no-scrollbar min-h-0 overflow-y-auto p-2">
        <ul className="space-y-0.5">
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

          <li aria-hidden className="my-1.5 border-t border-border" />

          {syllabus.map((topic) => {
            const isActive = topic.slug === activeTopicSlug
            const done = isTopicDone(topic.number)
            const subs =
              isActive && contentSubtopics && contentSubtopics.length > 0
                ? contentSubtopics
                : null

            return (
              <li key={topic.slug}>
                <LessonLink
                  href={`/curso?tema=${topic.slug}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    isActive ? "bg-secondary/70" : "hover:bg-secondary/40",
                  )}
                >
                  {/* Tres estados con lectura propia: el activo en el rojo de
                      la marca, lo terminado en verde y tachado, y lo pendiente
                      neutro y en el color de texto pleno, que es lo que queda
                      por hacer. */}
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                          : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {topic.number}
                  </span>
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
                  {done && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  )}
                  {isActive && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </LessonLink>

                {/* Subtopics of the active module */}
                {isActive && subs && (
                  <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {subs.map((sub) => {
                      const read = isLessonDone(topic.number, sub.id)
                      const activeSub = sub.id === activeSubtopicId
                      return (
                        <li key={sub.id}>
                          <LessonLink
                            href={`/curso?tema=${topic.slug}&sub=${sub.id}`}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                              activeSub
                                ? "font-medium text-primary"
                                : read
                                  ? "text-muted-foreground hover:text-foreground"
                                  : "text-foreground hover:text-primary",
                            )}
                          >
                            {read ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 shrink-0" />
                            )}
                            {/* `min-w-0` para que el nombre largo se corte en
                                vez de estirar el panel. */}
                            <span className="min-w-0 truncate">{sub.title}</span>
                          </LessonLink>
                        </li>
                      )
                    })}
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

/**
 * El panel en su columna, que es como se ve en escritorio.
 *
 * `top-0` y `max-h-full`: se pega al borde de su contenedor con scroll, que es
 * el <main> de la pagina y ya empieza debajo de la cabecera. Antes descontaba a
 * mano los 66px de la cabecera porque el que scrolleaba era la ventana. La
 * lista de temas sigue a mano mientras la pagina se desplaza.
 *
 * En movil se esconde: 320px que no ceden dejaban la leccion sin ancho. Alli el
 * mismo panel se despliega desde `SidebarMovil`.
 */
export function GroupSidebar(props: GroupSidebarProps) {
  return (
    <aside className="sticky top-0 hidden max-h-full w-80 shrink-0 pb-4 pt-16 md:block">
      <div className="mt-2 flex max-h-full overflow-hidden">
        <PanelContenidos {...props} />
      </div>
    </aside>
  )
}
