import Link from "next/link"
import { ListChecks, Target } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { getTopic } from "@shared/lib/content/temario"
import type { GroupActivitySummary } from "@/lib/features/student/group-activities"

const PILL = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"

/** Una actividad de curso (creada por el docente), con su estado y su nota. */
export function GroupActivityCard({ activity }: { activity: GroupActivitySummary }) {
  const topic = getTopic(activity.topicNumber)
  return (
    <Link
      href={`/terminal?ga=${activity.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02] hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.45),0_0_30px_rgba(245,158,11,0.3)]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <Target className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold tracking-tight text-foreground transition-colors group-hover:text-amber-400">
            {activity.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {activity.passed ? (
              <span className={cn(PILL, "border-emerald-500/40 text-emerald-500")}>
                Completada
              </span>
            ) : (
              <span className={cn(PILL, "border-amber-500/40 text-amber-500")}>
                Pendiente
              </span>
            )}
            {activity.lastScore !== null && (
              <span className={cn(PILL, "border-sky-500/40 text-sky-400")}>
                Nota: {activity.lastScore}/100
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {activity.description || "Sin instrucciones."}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          {topic ? `${topic.number}. ${topic.title}` : "Sin tema"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <ListChecks className="h-3 w-3" />
          {activity.checksCount} comprobaciones
        </span>
      </div>
    </Link>
  )
}
