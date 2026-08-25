"use client"

import { Loader2, ShieldCheck } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ActionButton } from "@shared/components/action-button"
import { CheckList } from "@/lib/features/student/components/check-list"
import { useActivityCheck } from "@/lib/features/student/use-activity-check"

/**
 * A *comprobación* inside a lesson: the fixed check that measures progress
 * through the course. It is not an activity — activities live outside the
 * syllabus and are solved next to the terminal.
 */
export function ExerciseCheck({ slug }: { slug: string }) {
  const { activity, rows, evaluated, passed, loading, checking, check } =
    useActivityCheck(slug)

  if (loading) {
    return (
      <div className="my-8 flex items-center justify-center rounded-xl border border-table-line py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!activity) {
    return <p className="my-8 text-sm text-muted-foreground">Comprobación no disponible.</p>
  }

  const edge = passed ? "border-success/40" : "border-amber-500/30"

  return (
    <section className={cn("my-8 rounded-xl border transition-colors", edge)}>
      <header className={cn("flex items-center gap-2.5 border-b px-5 py-3.5", edge)}>
        <ShieldCheck className={cn("h-4 w-4", passed ? "text-success" : "text-amber-500")} />
        <h3 className="text-sm font-semibold text-foreground">{activity.title}</h3>
        {passed && (
          <span className="ml-auto rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            Completada
          </span>
        )}
      </header>

      <div className="space-y-4 px-5 py-4">
        {activity.instructions && (
          <p className="text-sm leading-relaxed text-foreground">{activity.instructions}</p>
        )}

        <CheckList rows={rows} evaluated={evaluated} />

        <div className="flex items-center gap-3">
          <ActionButton tone={passed ? "emerald" : "amber"} onClick={check} disabled={checking}>
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {checking ? "Comprobando..." : "Comprobar"}
          </ActionButton>
          <p className="text-xs text-muted-foreground">
            Se revisa tu propia carpeta dentro del laboratorio.
          </p>
        </div>
      </div>
    </section>
  )
}
