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
  score = null,
  compact = false,
}: {
  activity: ActivityListing
  completed?: boolean
  /** La nota del último intento, si ya entregó alguno. */
  score?: { score: number; maxScore: number } | null
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
          {/* Bajo el titulo va como le fue y de que tamaño es el reto: primero
              si esta completada, despues la nota del ultimo intento y al final
              la dificultad. Se lee de izquierda a derecha como una frase. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {completed && <Tag tone="sky">Completada</Tag>}
            {score && (
              <Tag tone={score.score >= 60 ? "emerald" : "amber"}>
                {score.score}/{score.maxScore}
              </Tag>
            )}
            {activity.difficulty && (
              <Tag tone={DIFFICULTY_TONE[activity.difficulty]}>
                {DIFFICULTY_LABEL[activity.difficulty]}
              </Tag>
            )}
          </div>
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

      {/* Abajo queda el tema, que es lo unico que situa la actividad dentro del
          curso. La dificultad subio junto al titulo, con el resto del estado. */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Tag icon={BookOpen}>{activity.topicTitle}</Tag>
      </div>
    </Link>
  )
}
