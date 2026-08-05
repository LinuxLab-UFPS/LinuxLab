import { cn } from "@/lib/utils"

const TONE = {
  amber: {
    idle: "border-amber-500/60 text-amber-500 hover:border-amber-500 hover:bg-amber-500/10",
    active: "border-amber-500 bg-amber-500/15 text-amber-500 hover:bg-amber-500/25",
  },
  primary: {
    idle: "border-primary/60 text-primary hover:border-primary hover:bg-primary/10",
    active: "border-primary bg-primary/15 text-primary hover:bg-primary/25",
  },
} as const

/**
 * The switch for a panel around the terminal: a square with the icon of whatever
 * is inside it, in that panel's colour. Outlined it means "open this"; filled it
 * means the panel is showing and this closes it. Both sides use the same square,
 * so an open panel and a closed one always read the same.
 */
export function CollapsedPanelButton({
  tone,
  label,
  icon: Icon,
  onClick,
  active = false,
  className,
}: {
  tone: keyof typeof TONE
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  active?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl border transition-colors",
        active ? TONE[tone].active : TONE[tone].idle,
        className,
      )}
    >
      <Icon className="h-6 w-6" />
    </button>
  )
}
