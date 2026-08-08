"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Lightbulb, Loader2, RotateCcw, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Markdown } from "@/components/shared/markdown"
import { ActionButton } from "@/components/shared/action-button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { CheckList } from "@/components/student/check-list"
import { useActivityCheck } from "@/lib/features/student/use-activity-check"
import { DENSE_PROSE } from "@/lib/features/shared/prose"
import {
  DIFFICULTY_CLASS,
  DIFFICULTY_LABEL,
  type Activity,
} from "@/lib/features/shared/activities"
import type { LessonRef } from "@/lib/features/shared/lessons"

const PILL = "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium"

/**
 * An activity open next to the terminal: this is where activities are solved,
 * never inside the course.
 *
 * The header and the check button stay put while the statement scrolls on its
 * own, so the student never loses the button. What the laboratory will look at
 * is folded away behind a hint — the point is to work it out from the statement,
 * not to read the answer key first.
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
  const { activity: data, rows, evaluated, passed, loading, checking, error, check, reset, resetting } =
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
          <span className={cn(PILL, DIFFICULTY_CLASS[activity.difficulty])}>
            {DIFFICULTY_LABEL[activity.difficulty]}
          </span>
          <span
            className={cn(
              PILL,
              passed ? "border-sky-500/40 text-sky-400" : "border-border text-muted-foreground",
            )}
          >
            {passed ? "Completada" : "Sin completar"}
          </span>
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
        ) : (
          <Collapsible className="mt-6" defaultOpen={evaluated}>
            <CollapsibleTrigger
              title="Qué se va a revisar"
              aria-label="Qué se va a revisar"
              className="inline-flex rounded-md border border-amber-500/30 p-1.5 text-amber-500 transition-colors hover:bg-amber-500/10"
            >
              <Lightbulb className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CheckList rows={rows} evaluated={evaluated} className="mt-3" />
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      <footer className="shrink-0 space-y-3 border-t border-border pt-4">
        {error && (
          <p className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
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
