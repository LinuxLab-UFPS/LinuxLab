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
  sky: "border-sky-500/50 bg-sky-500/10 text-sky-500",
  emerald: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
}

/**
 * Calcula que numeros de pagina mostrar. Con 9 o menos, todos; con mas, un
 * ventana alrededor de la actual con elipsis en los extremos (1 2 3 ... N).
 */
function pageNumbers(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const set = new Set<number>([1, totalPages, page - 1, page, page + 1])
  const sorted = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  const out: (number | "…")[] = []
  let prev = 0
  for (const n of sorted) {
    if (n - prev > 1) out.push("…")
    out.push(n)
    prev = n
  }
  return out
}

/** Pager de tablas: rango visible ("Mostrando X–Y de Z"), numeros de pagina y
 *  flechas. El rango y la etiqueta son opcionales: si no se pasan, solo se
 *  muestran los controles de pagina. */
export function TablePagination({
  page,
  totalPages,
  onChange,
  tone = "primary",
  total,
  pageSize,
  label = "registros",
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
  tone?: keyof typeof PAGE_TONE
  total?: number
  pageSize?: number
  label?: string
}) {
  const from = total != null && pageSize != null ? (page - 1) * pageSize + 1 : null
  const to = total != null && pageSize != null ? Math.min(page * pageSize, total) : null
  const nums = pageNumbers(page, totalPages)

  return (
    <div className="flex flex-col items-center gap-3 pt-6 sm:flex-row sm:justify-between">
      {total != null && from != null && to != null ? (
        <span className="text-sm text-muted-foreground">
          Mostrando {from}–{to} de {total} {label}
        </span>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Página anterior"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-table-line text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {nums.map((num, i) =>
          num === "…" ? (
            <span key={`e${i}`} className="flex h-8 items-center px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              disabled={num === page}
              aria-current={num === page ? "page" : undefined}
              aria-label={`Página ${num}`}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                num === page
                  ? PAGE_TONE[tone]
                  : "border-table-line text-muted-foreground hover:bg-secondary",
              )}
            >
              {num}
            </button>
          ),
        )}

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
    </div>
  )
}
