import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip"

/**
 * Accion de fila de una tabla. Por defecto es un icono minimalista en gris que
 * solo oscurece al pasar el raton; con `variant="boxed"` gana un contenedor
 * bordeado del tamaño de los botones de paginacion, para las acciones que
 * deben verse como botones de verdad. Con `tone="danger"` el contenedor
 * queda en rojo (acciones destructivas o de cierre).
 */
export function IconAction({
  label,
  icon: Icon,
  size = "md",
  variant = "ghost",
  tone = "neutral",
  href,
  onClick,
  disabled,
  className,
}: {
  /** Texto del tooltip y del aria-label. */
  label: string
  icon: LucideIcon
  size?: "md" | "sm"
  /** "ghost" es el icono suelto de siempre; "boxed" agrega el borde visible. */
  variant?: "ghost" | "boxed"
  /** Solo aplica a "boxed": neutral sigue la paleta de la paginacion. */
  tone?: "neutral" | "danger"
  href?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const style = cn(
    "inline-flex shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-50",
    variant === "boxed"
      ? cn(
          "border",
          size === "md" ? "h-9 w-9" : "h-7 w-7",
          tone === "danger"
            ? "border-danger/40 text-danger hover:bg-danger/10"
            : "border-table-line text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
        )
      : cn(
          "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
          size === "md" ? "h-8 w-8" : "h-7 w-7",
        ),
    className,
  )
  const iconSize = variant === "boxed" && size === "md" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"

  const content = href ? (
    <Link href={href} className={style} aria-label={label}>
      <Icon className={iconSize} />
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={style} aria-label={label}>
      <Icon className={iconSize} />
    </button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
