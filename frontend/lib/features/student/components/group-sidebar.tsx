"use client"

import Link from "next/link"
import { CheckCircle2, ChevronRight, Circle, Home } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { syllabus } from "@shared/lib/content/temario"
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
 */
export function GroupSidebar({
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
    // Pegada bajo la cabecera (64px) y su barra de progreso (2px): la lista de
    // temas sigue a mano mientras la pagina se desplaza.
    <aside className="sticky top-[66px] max-h-[calc(100vh-66px)] w-80 shrink-0 pb-4 pt-16">
      <div className="mt-2 flex max-h-full flex-col overflow-hidden rounded-xl border border-black/15 bg-background shadow-md dark:border-border dark:shadow-none">
        {/* Nav: home + title */}
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
          <Link
            href="/home"
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

        {/* Module list */}
        <nav className="no-scrollbar min-h-0 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {syllabus.map((topic) => {
              const isActive = topic.slug === activeTopicSlug
              const done = isTopicDone(topic.number)
              const subs =
                isActive && contentSubtopics && contentSubtopics.length > 0
                  ? contentSubtopics
                  : null

              return (
                <li key={topic.slug}>
                  <Link
                    href={`/group?tema=${topic.slug}`}
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
                  </Link>

                  {/* Subtopics of the active module */}
                  {isActive && subs && (
                    <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-border pl-3">
                      {subs.map((sub) => {
                        const read = isLessonDone(topic.number, sub.id)
                        const activeSub = sub.id === activeSubtopicId
                        return (
                          <li key={sub.id}>
                            <Link
                              href={`/group?tema=${topic.slug}&sub=${sub.id}`}
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
                              <span className="truncate">{sub.title}</span>
                            </Link>
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

        {/* Overall progress */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tu progreso</span>
            <span className="font-mono tabular-nums text-foreground">
              {doneCount}/{syllabus.length}
            </span>
          </div>
          <NeonProgress value={overallPct} className="h-1" />
        </div>
      </div>
    </aside>
  )
}
