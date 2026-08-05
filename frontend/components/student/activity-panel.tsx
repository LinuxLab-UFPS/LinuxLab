"use client"

import Link from "next/link"
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Markdown } from "@/components/shared/markdown"
import { ActionButton } from "@/components/shared/action-button"
import { CheckList } from "@/components/student/check-list"
import { useActivityCheck } from "@/lib/features/student/use-activity-check"
import {
  DIFFICULTY_CLASS,
  DIFFICULTY_LABEL,
  type Activity,
} from "@/lib/features/shared/activities"

/**
 * An activity open next to the terminal: this is where activities are solved,
 * never inside the course.
 *
 * The title and the check button stay put while the statement scrolls on its
 * own, so the student can read the whole thing without ever losing the button.
 */
export function ActivityPanel({
  activity,
  statement,
}: {
  activity: Activity
  statement: string
}) {
  const { rows, evaluated, passed, loading, checking, error, check } = useActivityCheck(
    activity.slug,
  )

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-background p-5">
      <header className="shrink-0">
        <Link
          href="/terminal"
          className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{activity.title}</h1>
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
              DIFFICULTY_CLASS[activity.difficulty],
            )}
          >
            {DIFFICULTY_LABEL[activity.difficulty]}
          </span>
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
              passed
                ? "border-sky-500/40 text-sky-400"
                : "border-border text-muted-foreground",
            )}
          >
            {passed ? "Completada" : "Sin completar"}
          </span>
        </div>
      </header>

      <div className="my-4 min-h-0 flex-1 overflow-y-auto pr-2">
        <div className="lesson-prose [&>*:first-child]:mt-0">
          <Markdown>{statement}</Markdown>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CheckList rows={rows} evaluated={evaluated} className="mt-6" />
        )}
      </div>

      <footer className="shrink-0 space-y-3 border-t border-border pt-4">
        {error && (
          <p className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
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
      </footer>
    </div>
  )
}
