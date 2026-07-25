"use client"

import Link from "next/link"
import { CheckCircle2, Circle, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { syllabus } from "@/lib/features/shared/temario"
import { NeonProgress } from "@/components/shared/neon-progress"
import { useLessonProgress } from "@/lib/features/student/progress"
import type { LessonSubtopic } from "@/lib/features/shared/types"

interface GroupSidebarProps {
  activeTopicSlug: string
  activeSubtopicId?: string
  /** Subtopics of the active topic, when it has published content. */
  contentSubtopics?: LessonSubtopic[]
  /** Lesson count per topic number, for the completion state. */
  lessonCounts: Record<number, number>
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
  lessonCounts,
  groupName,
}: GroupSidebarProps) {
  const { readCountForTopic, isRead } = useLessonProgress()

  const isModuleDone = (topicNumber: number) => {
    const total = lessonCounts[topicNumber] ?? 0
    return total > 0 && readCountForTopic(topicNumber) >= total
  }

  const doneCount = syllabus.filter((t) => isModuleDone(t.number)).length
  const overallPct = Math.round((doneCount / syllabus.length) * 100)

  return (
    <aside className="w-80 shrink-0 p-3">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
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
            {groupName ?? "Contenidos del grupo"}
          </h2>
        </div>

        {/* Module list */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {syllabus.map((topic) => {
              const isActive = topic.slug === activeTopicSlug
              const done = isModuleDone(topic.number)
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
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {topic.number}
                    </span>
                    <span
                      className={cn(
                        "flex-1 truncate text-sm",
                        done
                          ? "text-muted-foreground"
                          : isActive
                            ? "font-medium text-foreground"
                            : "text-foreground/80",
                      )}
                    >
                      {topic.title}
                    </span>
                    {done && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    )}
                  </Link>

                  {/* Subtopics of the active module */}
                  {isActive && subs && (
                    <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-border pl-3">
                      {subs.map((sub) => {
                        const read = isRead(topic.number, sub.id)
                        const activeSub = sub.id === activeSubtopicId
                        return (
                          <li key={sub.id}>
                            <Link
                              href={`/group?tema=${topic.slug}&sub=${sub.id}`}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                                activeSub
                                  ? "font-medium text-primary"
                                  : "text-muted-foreground hover:text-foreground",
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
