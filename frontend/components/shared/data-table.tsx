import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Panel que envuelve cualquier tabla de docente/admin, con el look de GitHub:
 * solo la fila de encabezado va sobre la superficie gris (`--table-surface`);
 * las entradas quedan transparentes y lo unico que las separa es una linea del
 * mismo color del marco (`--table-line`).
 *
 * Todo el estilo de celdas vive aqui a proposito (padding, alineacion,
 * tipografia del encabezado, hover de fila) para que las tablas de cursos,
 * banco y bitacora se vean identicas sin repetir clases en cada `<th>`/`<td>`.
 * Las tablas solo aportan el contenido.
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
        // En claro va levantada con sombra, igual que el resto de paneles de
        // la app; en oscuro basta el marco.
        "overflow-hidden rounded-xl border border-table-line bg-background shadow-md dark:shadow-none",
        // Separadores: misma linea del marco, y la ultima fila sin borde para
        // que no quede una raya doble contra el borde inferior del panel.
        "[&_tr]:border-table-line [&_tbody_tr:last-child]:border-0",
        // Encabezado: unica fila con fondo, etiquetas cortas en mayuscula y
        // siempre a la izquierda.
        "[&_thead_tr]:bg-table-surface",
        "[&_th]:px-5 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground",
        // Entradas: alineadas a la izquierda igual que su titulo de columna.
        "[&_td]:px-5 [&_td]:py-3.5 [&_td]:text-left [&_td]:align-middle",
        // Hover neutro: funciona igual en claro y oscuro porque se tinta con el
        // color de texto, no con un gris fijo.
        "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-foreground/[0.04]",
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

/**
 * Encabezado de una seccion con tabla: titulo discreto a la izquierda y una
 * accion opcional ("Ver mas") a la derecha. Se usa en el resumen del curso.
 */
export function TableSectionHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-2.5 flex min-h-8 items-center justify-between gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {action}
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

/**
 * Boton compacto que lleva a la vista completa de una seccion ("Ver mas").
 * Va en el mismo gris del encabezado de la tabla: es navegacion secundaria, no
 * la accion principal de la pantalla.
 */
export function TableSectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-md border border-table-line bg-table-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
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
        className="flex h-8 w-8 items-center justify-center rounded-md border border-table-line text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-section/50 bg-section/10 text-sm font-medium text-section">
        {page}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Página siguiente"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-table-line text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
