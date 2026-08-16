"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, ShieldCheck } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { Markdown } from "@shared/components/markdown"
import { ActionButton } from "@shared/components/action-button"
import { CheckList } from "@/lib/features/student/components/check-list"
import { useActivityCheck } from "@/lib/features/student/use-activity-check"
import { DENSE_PROSE } from "@shared/lib/content/prose"
import {
  DIFFICULTY_TONE,
  DIFFICULTY_LABEL,
  type Activity,
} from "@shared/lib/content/activities"
import { Tag } from "@shared/components/tag"
import type { LessonRef } from "@shared/lib/content/lessons"


/**
 * An activity open next to the terminal: this is where activities are solved,
 * never inside the course.
 *
 * The header and the check button stay put while the statement scrolls on its
 * own, so the student never loses the button. What the laboratory looks at is
 * only listed once the activity is solved: an activity is a challenge, and
 * reading the assertions beforehand is reading the answer.
 */
export function ActivityPanel({
  activity,
  statement,
  origin,
  next,
}: {
  activity: Activity
  statement: string
  /** The lesson the student came from, if any. */
  origin?: string
  /** Where the course continues after that lesson. */
  next?: LessonRef | null
}) {
  const { activity: data, rows, evaluated, passed, loading, checking, check, reset, resetting } =
    useActivityCheck(activity.slug)

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-background p-5">
      <header className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={origin ?? "/terminal"}
            className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Link>

          {/* Sólo tiene sentido seguir el curso si vino de él y ya cumplió. */}
          {origin && next && passed && (
            <Link
              href={next.href}
              className="neon-glow hover:neon-glow-strong group inline-flex items-center gap-2 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90"
            >
              Siguiente tema
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{activity.title}</h1>
          <Tag tone={activity.difficulty ? DIFFICULTY_TONE[activity.difficulty] : "neutral"}>
            {activity.difficulty ? DIFFICULTY_LABEL[activity.difficulty] : "—"}
          </Tag>
          <Tag tone={passed ? "sky" : "neutral"}>
            {passed ? "Completada" : "Sin completar"}
          </Tag>
        </div>
      </header>

      <div className={cn("my-4 min-h-0 flex-1 overflow-y-auto pr-2", DENSE_PROSE)}>
        <div className="lesson-prose [&>*:first-child]:mt-0">
          <Markdown>{statement}</Markdown>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : passed ? (
          <CheckList rows={rows} evaluated={evaluated} className="mt-6" />
        ) : (
          evaluated && (
            <p className="mt-6 text-sm text-muted-foreground">
              {rows.filter((row) => row.passed).length} de {rows.length}{" "}
              {rows.length === 1 ? "comprobación lista" : "comprobaciones listas"}.
            </p>
          )
        )}
      </div>

      <footer className="shrink-0 space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <ActionButton
            tone={passed ? "emerald" : "amber"}
            onClick={check}
            disabled={checking || loading}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {checking ? "Comprobando..." : "Comprobar actividad"}
          </ActionButton>

          {/* Sólo las actividades que preparan archivos se pueden rehacer, y es
              lo que permite plantear ejercicios donde haya que borrar cosas. */}
          {data?.hasSetup && (
            <ActionButton tone="neutral" onClick={reset} disabled={resetting || loading}>
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {resetting ? "Preparando..." : "Reiniciar archivos"}
            </ActionButton>
          )}
        </div>
      </footer>
    </div>
  )
}
