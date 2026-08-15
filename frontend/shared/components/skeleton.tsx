import { cn } from "@shared/lib/utils"

/**
 * Bloque gris que ocupa el sitio de algo que todavia no ha llegado.
 *
 * Se pinta de inmediato, sin retraso: el problema que resuelve es la pagina que
 * parece congelada mientras el servidor responde, y un esqueleto que aparece
 * tarde no lo resuelve. Como imita la forma de lo que viene, el contenido real
 * no da un salto al sustituirlo; ese es el motivo de que sea un bloque con la
 * medida del contenido y no una ruedecita centrada.
 *
 * `aria-hidden` porque no dice nada: quien use lector de pantalla oye el
 * "Cargando" de la region que lo envuelve.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted", className)} />
}

/**
 * Envoltorio de una pantalla en carga. Anuncia el estado una sola vez, en vez
 * de que cada bloque lo repita.
 */
export function SkeletonScreen({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">Cargando…</span>
      {children}
    </div>
  )
}
