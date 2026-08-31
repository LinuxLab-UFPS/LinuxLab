import Link from "next/link"
import { cn } from "@shared/lib/utils"

export type ActionTone = "primary" | "amber" | "sky" | "emerald" | "neutral" | "danger"

/** Relleno de baja opacidad y texto en el color pleno, uno por sección. */
const TONE: Record<ActionTone, string> = {
  primary: "border-primary/40 bg-primary/15 text-primary hover:bg-primary/25",
  amber: "border-amber-500/40 bg-amber-500/15 text-amber-500 hover:bg-amber-500/25",
  sky: "border-sky-500/40 bg-sky-500/15 text-sky-500 hover:bg-sky-500/25",
  emerald: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
  neutral:
    "border-foreground/20 bg-secondary text-foreground hover:border-foreground/35 hover:bg-secondary/70",
  danger: "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
}

/**
 * Botón de acción de las vistas de docente y admin (y el compacto de las
 * filas de tabla con `size="sm"`). Cada sección usa su color y ninguno lleva
 * relleno sólido ni halo: el neón queda para la navegación entre temas de una
 * lección.
 */
export function ActionButton({
  tone = "primary",
  size = "md",
  href,
  onClick,
  type = "button",
  disabled,
  className,
  children,
}: {
  tone?: ActionTone
  size?: "md" | "sm"
  href?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
  children: React.ReactNode
}) {
  const style = cn(
    // `justify-center` no cambia nada cuando el boton se ajusta a su contenido,
    // que es lo normal; solo importa cuando algo lo estira (una columna en
    // movil), y ahi evita que el icono y el texto se queden pegados a la
    // izquierda con todo el hueco a la derecha.
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border font-medium transition-colors disabled:opacity-60",
    size === "md"
      ? "px-3.5 py-2 text-sm"
      : "px-2.5 py-1 text-xs",
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
