import { cn } from "@/lib/utils"

/**
 * The red progress bar used for reading progress and per-topic progress.
 * `neon-glow` only kicks in once there is something to show, so an empty bar
 * doesn't glow.
 */
export function NeonProgress({
  value,
  className,
  barClassName,
}: {
  /** 0 to 100. */
  value: number
  className?: string
  barClassName?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-150 ease-out",
          pct > 0 && "neon-glow",
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
