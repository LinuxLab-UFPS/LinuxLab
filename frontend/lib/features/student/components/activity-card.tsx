import Link from "next/link"
import { BookOpen, Target } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { DIFFICULTY_TONE, DIFFICULTY_LABEL } from "@shared/lib/content/activities"
import { Tag } from "@shared/components/tag"
import type { ActivityListing } from "@/lib/models/activities"

const GLOW =
  "hover:border-primary/50 hover:shadow-[var(--neon-glow-strong)]"

/**
 * An activity, wherever it is offered: the catalog, the panel next to the
 * terminal, or a topic that advertises it. It never links into the course —
 * activities are always solved next to the terminal.
 *
 * `compact` is the same card with the description clamped, for the narrow
 * column beside the terminal.
 */
export function ActivityCard({
  activity,
  completed = false,
  compact = false,
}: {
  activity: ActivityListing
  completed?: boolean
  compact?: boolean
}) {
  return (
    <Link
      href={activity.href}
      className={cn(
        "group flex flex-col rounded-2xl border border-border bg-card transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02]",
        GLOW,
        compact ? "p-4" : "p-5",
      )}
    >
      {/* `items-center` y no `items-start`: el titulo se alinea con el centro
          del icono en vez de con su borde de arriba, que es lo que se lee como
          alineado cuando el icono es un circulo. */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
            compact ? "h-8 w-8" : "h-10 w-10",
          )}
        >
          <Target className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </span>

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "font-bold tracking-tight text-foreground transition-colors group-hover:text-primary",
              compact ? "text-sm" : "text-base",
            )}
          >
            {activity.title}
          </h3>
          {/* Junto al titulo queda solo el estado, que es lo unico que cambia
              con el tiempo. La dificultad baja con el tema: las dos dicen que
              clase de actividad es, no como va. */}
          {completed && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Tag tone="sky">Completada</Tag>
            </div>
          )}
        </div>
      </div>

      <p
        className={cn(
          "mt-3 leading-relaxed text-muted-foreground",
          compact ? "line-clamp-2 text-xs" : "text-sm",
        )}
      >
        {activity.description}
      </p>

      {/* En una fila y con el tema delante: primero de que va la actividad y
          despues lo que cuesta. */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Tag icon={BookOpen}>{activity.topicTitle}</Tag>
        {activity.difficulty && (
          <Tag tone={DIFFICULTY_TONE[activity.difficulty]}>
            {DIFFICULTY_LABEL[activity.difficulty]}
          </Tag>
        )}
      </div>
    </Link>
  )
}
