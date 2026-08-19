import Link from "next/link"
import { Target } from "lucide-react"
import { Tag } from "@shared/components/tag"
import type { GroupActivitySummary } from "@/lib/features/student/group-activities"


/** Una actividad de curso (creada por el docente), con su estado y su nota. */
export function GroupActivityCard({ activity }: { activity: GroupActivitySummary }) {
  const limitReached = activity.attemptLimit != null && activity.attemptsCount >= activity.attemptLimit
  return (
    <Link
      href={`/terminal?ga=${activity.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02] hover:border-primary/50 hover:shadow-[var(--neon-glow-strong)]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Target className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {activity.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {!activity.enabled ? (
              <Tag tone="rose">Deshabilitada</Tag>
            ) : activity.attemptLimit != null && limitReached ? (
              <Tag tone="rose">Límite alcanzado</Tag>
            ) : (
              <Tag tone={activity.completed ? "emerald" : "amber"}>
                {activity.completed ? "Completada" : "Pendiente"}
              </Tag>
            )}
            <Tag tone="neutral">
              {activity.activityType === "quiz" ? "Quiz" : "Taller"}
            </Tag>
            <Tag tone="primary">
              Calificación: {activity.finalScore}/100
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
