import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@shared/lib/utils"

/**
 * El estado vacio de cualquier listado: icono, titulo y una explicacion de que
 * hacer al respecto. Mismo lenguaje que las demas tarjetas de la app (borde,
 * superficie y esquinas redondeadas), para que un listado sin datos no parezca
 * una pantalla rota sino una vista que todavía no tiene nada que mostrar.
 *
 * Centrado y con ancho maximo por defecto: un vacio no necesita una plancha a
 * todo lo ancho de la pantalla; quien lo quiera extenso lo sobreescribe con
 * `className`.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border border-border bg-card px-6 py-10 text-center",
        className,
      )}
    >
      <span className="mx-auto mb-3 flex h-8 w-8 items-center justify-center text-muted-foreground">
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
