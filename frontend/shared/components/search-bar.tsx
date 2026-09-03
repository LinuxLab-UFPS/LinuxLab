import { Search, X } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { CONTROL_SURFACE } from "@shared/components/control-surface"
import { Input } from "@shared/components/ui/input"

/**
 * La barra de busqueda del sitio, en un solo componente.
 *
 * Mismo alto (`h-9`) y radio (`rounded-md`) que los botones, y la misma
 * superficie: blanca en claro, gris en oscuro (ver `CONTROL_SURFACE`). Trae la
 * lupa a la izquierda y, mientras hay texto, el boton de limpiar a la derecha.
 *
 * Es controlada: `onChange` recibe el texto ya limpio de maquetacion; quien lo
 * usa decide que hacer con el (filtrar, resetear su paginacion, etc.).
 */
export function SearchBar({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Etiqueta accesible; por defecto el placeholder. */
  ariaLabel?: string
  /** Ancho y margenes; el componente no impone tamano. */
  className?: string
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn("h-9 rounded-md border-input pl-9 pr-8", CONTROL_SURFACE)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
