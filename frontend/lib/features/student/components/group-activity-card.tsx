import Link from "next/link"
import { Target } from "lucide-react"
import { Tag } from "@shared/components/tag"
import type { GroupActivitySummary } from "@/lib/features/student/group-activities"


/** Una actividad de curso (creada por el docente), con su estado y su nota. */
export function GroupActivityCard({ activity }: { activity: GroupActivitySummary }) {
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
          <h3 className="line-clamp-1 font-bold tracking-tight text-foreground transition-colors group-hover:text-amber-400">
            {activity.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {activity.completed ? (
              activity.finalScore > 0 ? (
                <Tag tone={activity.finalScore >= 80 ? "emerald" : activity.finalScore >= 60 ? "amber" : "rose"}>
                  Calificación: {activity.finalScore}/100
                </Tag>
              ) : (
                <Tag tone="amber">Pendiente por calificar</Tag>
              )
            ) : (
              <Tag tone="neutral">Pendiente</Tag>
            )}
            <Tag tone="neutral">
              {activity.activityType === "quiz" ? "Quiz" : "Taller"}
            </Tag>
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {activity.description || "Sin instrucciones."}
      </p>

    </Link>
  )
}
