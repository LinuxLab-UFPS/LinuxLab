import Link from "next/link"
import { BookOpen, ListChecks, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DIFFICULTY_CLASS,
  DIFFICULTY_LABEL,
  type Activity,
} from "@/lib/features/shared/activities"

const GLOW =
  "hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.45),0_0_30px_rgba(245,158,11,0.3)]"

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
  activity: Activity
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
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500",
            compact ? "h-8 w-8" : "h-10 w-10",
          )}
        >
          <Target className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </span>

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "font-bold tracking-tight text-foreground transition-colors group-hover:text-amber-400",
              compact ? "text-sm" : "text-base",
            )}
          >
            {activity.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Pill className={DIFFICULTY_CLASS[activity.difficulty]}>
              {DIFFICULTY_LABEL[activity.difficulty]}
            </Pill>
            {completed && (
              <Pill className="border-sky-500/40 text-sky-400">Completada</Pill>
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

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Tag icon={BookOpen} className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
          {activity.topicTitle}
        </Tag>
        <Tag icon={ListChecks} className="bg-foreground/5 text-muted-foreground">
          {activity.checks} comprobaciones
        </Tag>
      </div>
    </Link>
  )
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {children}
    </span>
  )
}

function Tag({
  icon: Icon,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  className: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  )
}
