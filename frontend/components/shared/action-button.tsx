import Link from "next/link"
import { cn } from "@/lib/utils"

export type ActionTone = "primary" | "amber" | "violet" | "sky" | "neutral"

/** Relleno de baja opacidad y texto en el color pleno, uno por sección. */
const TONE: Record<ActionTone, string> = {
  primary: "border-primary/40 bg-primary/15 text-primary hover:bg-primary/25",
  amber: "border-amber-500/40 bg-amber-500/15 text-amber-500 hover:bg-amber-500/25",
  violet: "border-violet-500/40 bg-violet-500/15 text-violet-400 hover:bg-violet-500/25",
  sky: "border-sky-500/40 bg-sky-500/15 text-sky-500 hover:bg-sky-500/25",
  neutral:
    "border-table-line bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground",
}

/**
 * Botón de acción de las vistas de docente y admin. Cada sección usa su color y
 * ninguno lleva relleno sólido ni halo: el neón queda para la navegación entre
 * temas de una lección.
 */
export function ActionButton({
  tone = "primary",
  href,
  onClick,
  type = "button",
  disabled,
  className,
  children,
}: {
  tone?: ActionTone
  href?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
  children: React.ReactNode
}) {
  const style = cn(
    "inline-flex shrink-0 items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60",
    TONE[tone],
    className,
  )

  if (href) {
    return (
      <Link href={href} className={style}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={style}>
      {children}
    </button>
  )
}
