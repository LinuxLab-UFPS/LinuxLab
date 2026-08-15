import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip"

/**
 * Accion de fila de una tabla: icono minimalista en gris que solo oscurece al
 * pasar el raton, con tooltip y aria-label. Reemplaza a los botones con texto
 * que sobrecargaban los listados.
 */
export function IconAction({
  label,
  icon: Icon,
  size = "md",
  href,
  onClick,
  disabled,
  className,
}: {
  /** Texto del tooltip y del aria-label. */
  label: string
  icon: LucideIcon
  size?: "md" | "sm"
  href?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const style = cn(
    "inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-50",
    size === "md" ? "h-8 w-8" : "h-7 w-7",
    className,
  )

  const content = href ? (
    <Link href={href} className={style} aria-label={label}>
      <Icon className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} />
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={style} aria-label={label}>
      <Icon className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} />
    </button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
