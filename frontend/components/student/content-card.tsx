import Link from "next/link"
import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import { NeonProgress } from "@/components/shared/neon-progress"
import { cn } from "@/lib/utils"

export interface CardTag {
  icon: LucideIcon
  label: string
  className: string
}

type Accent = "red" | "green"

/** Per-accent hover treatment: title tint, underline gradient and card glow. */
const ACCENT: Record<Accent, { title: string; underline: string; card: string }> = {
  red: {
    title: "group-hover:text-primary",
    underline: "from-[#ff5470] to-[#C41E3A]",
    card: "hover:border-primary/50 hover:shadow-[var(--neon-glow-strong)]",
  },
  green: {
    title: "group-hover:text-emerald-400",
    underline: "from-emerald-400 to-emerald-600",
    card: "hover:border-emerald-500/50 hover:shadow-[0_0_10px_rgba(16,185,129,0.45),0_0_30px_rgba(16,185,129,0.3)]",
  },
}

/**
 * The AlgoMaster-style card, reused by the topic grid and the simulators grid.
 * The illustration zooms and the whole card lifts and glows on hover while the
 * text stays put. Progress bar and tags are optional; the accent drives the
 * hover colors (red for topics, green for simulators).
 */
export function ContentCard({
  href,
  title,
  description,
  illustration: Illustration,
  tags = [],
  progress,
  accent = "red",
}: {
  href: string
  title: string
  description?: string
  illustration: ComponentType
  tags?: CardTag[]
  progress?: number
  accent?: Accent
}) {
  const a = ACCENT[accent]

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02]",
        a.card,
      )}
    >
      {/* Illustration panel: dark, and the drawing zooms on hover. */}
      <div className="overflow-hidden border-b border-border bg-[#0d1117]">
        <div className="flex aspect-[16/10] items-center justify-center p-6 transition-transform duration-500 ease-out group-hover:scale-110">
          <Illustration />
        </div>
      </div>

      {/* Content stays steady while the card and image grow. */}
      <div className="flex flex-1 flex-col p-5">
        <h3
          className={cn(
            "text-lg font-bold tracking-tight text-foreground transition-colors",
            a.title,
          )}
        >
          {title}
        </h3>
        <span
          className={cn(
            "mt-1.5 h-0.5 w-0 rounded-full bg-gradient-to-r transition-all duration-300 ease-out group-hover:w-12",
            a.underline,
          )}
        />
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  tag.className,
                )}
              >
                <tag.icon className="h-3 w-3" />
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {progress !== undefined && (
          <div className="mt-auto pt-5">
            <div className="flex items-center gap-2">
              <NeonProgress value={progress} />
              <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                {progress}%
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
