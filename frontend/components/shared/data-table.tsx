import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Outlined panel wrapping an admin/teacher table: same background as the page,
 * a subtle outline (darker in light mode so it stays visible, like the course
 * contents panel and resource cards), rounded corners.
 */
export function TablePanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-black/15 bg-background dark:border-border",
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export function TableEmptyState({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-16 text-center text-sm text-muted-foreground">{children}</div>
}

type ActionTone = "neutral" | "amber" | "emerald" | "danger"

const TONE: Record<ActionTone, string> = {
  neutral: "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
  amber: "border-amber-500/40 text-amber-500 hover:bg-amber-500/10",
  emerald: "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10",
  danger: "border-danger/40 text-danger hover:bg-danger/10",
}

/** Small outlined pill action used in admin/teacher table rows (Ver, Archivar...). */
export function TableActionButton({
  tone,
  onClick,
  href,
  children,
}: {
  tone: ActionTone
  onClick?: () => void
  href?: string
  children: React.ReactNode
}) {
  const className = cn(
    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
    TONE[tone],
  )
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  )
}

/** Minimal prev / current-page / next pager, for tables with many rows. */
export function TablePagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Página anterior"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-black/15 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent dark:border-border"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/50 bg-primary/10 text-sm font-medium text-primary">
        {page}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Página siguiente"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-black/15 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent dark:border-border"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
