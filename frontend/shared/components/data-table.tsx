import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@shared/lib/utils"

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
        // siempre centrado.
        "[&_thead_tr]:bg-table-surface",
        "[&_th]:px-5 [&_th]:py-3 [&_th]:text-center [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground",
        // Entradas: centradas igual que su titulo de columna.
        "[&_td]:px-5 [&_td]:py-3.5 [&_td]:text-center [&_td]:align-middle",
        // Hover neutro: funciona igual en claro y oscuro porque se tinta con el
        // color de texto, no con un gris fijo.
        "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-foreground/[0.06]",
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

/**
 * Encabezado de una seccion con tabla: titulo discreto y, pegada a el, una
 * accion opcional ("Ver mas"). Van juntos a proposito para que el boton se lea
 * como parte del titulo y no flotando al otro extremo de la fila.
 */
export function TableSectionHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-2.5 flex min-h-8 items-center gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {action}
    </div>
  )
}

export function TableEmptyState({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-16 text-center text-sm text-muted-foreground">{children}</div>
}

/** Color de la página actual. Va explícito y no por `--section` para que no
 *  dependa de dónde esté montada la tabla. */
const PAGE_TONE = {
  primary: "border-primary/50 bg-primary/10 text-primary",
  amber: "border-amber-500/50 bg-amber-500/10 text-amber-500",
  violet: "border-violet-500/50 bg-violet-500/10 text-violet-400",
  sky: "border-sky-500/50 bg-sky-500/10 text-sky-500",
  emerald: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
}

/** Minimal prev / current-page / next pager, for tables with many rows. */
export function TablePagination({
  page,
  totalPages,
  onChange,
  tone = "primary",
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
  tone?: keyof typeof PAGE_TONE
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
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium",
          PAGE_TONE[tone],
        )}
      >
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
