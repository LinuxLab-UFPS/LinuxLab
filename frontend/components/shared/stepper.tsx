"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Step {
  id: string
  label: string
}

interface Marca {
  indice: number
  hecho: boolean
  activo: boolean
  onSelect?: (index: number) => void
}

/** El círculo numerado, que se vuelve botón cuando el paso ya se completó. */
function Circulo({ indice, hecho, activo, onSelect }: Marca) {
  const navegable = hecho && Boolean(onSelect)
  const Etiqueta = navegable ? "button" : "div"

  return (
    <Etiqueta
      {...(navegable ? { type: "button" as const, onClick: () => onSelect?.(indice) } : {})}
      aria-current={activo ? "step" : undefined}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
        activo && "border-primary bg-primary/15 text-primary",
        hecho && "border-primary/40 bg-primary/10 text-primary",
        !activo && !hecho && "border-table-line bg-secondary text-muted-foreground",
        navegable && "cursor-pointer hover:border-primary",
      )}
    >
      {hecho ? <Check className="h-4 w-4" /> : indice + 1}
    </Etiqueta>
  )
}

function Rotulo({ indice, label, encendido }: { indice: number; label: string; encendido: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Paso {indice + 1}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-medium transition-colors",
          encendido ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
    </div>
  )
}

/**
 * Los pasos de un asistente, en riel vertical u horizontal.
 *
 * Las dos disposiciones se escriben por separado a propósito: en vertical la
 * línea cuelga bajo el círculo y en horizontal separa un paso del siguiente,
 * así que compartir un solo árbol obligaba a contorsionarlo.
 *
 * Los pasos ya completados son botones, de modo que se puede volver atrás desde
 * el riel; los que faltan no, porque llegar a ellos exige pasar por los previos.
 */
export function Stepper({
  steps,
  current,
  onSelect,
  orientation = "vertical",
  className,
}: {
  steps: Step[]
  /** Índice del paso activo, desde 0. */
  current: number
  /** Sin esto el riel sólo informa y no navega. */
  onSelect?: (index: number) => void
  orientation?: "vertical" | "horizontal"
  className?: string
}) {
  const estado = (i: number) => ({
    indice: i,
    hecho: i < current,
    activo: i === current,
    onSelect,
  })

  if (orientation === "horizontal") {
    return (
      <ol className={cn("flex items-center", className)}>
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={cn("flex min-w-0 items-center gap-3", i < steps.length - 1 && "flex-1")}
          >
            <Circulo {...estado(i)} />
            <Rotulo indice={i} label={step.label} encendido={i <= current} />
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mx-4 h-px min-w-8 flex-1 transition-colors",
                  i < current ? "bg-primary/40" : "bg-table-line",
                )}
              />
            )}
          </li>
        ))}
      </ol>
    )
  }

  return (
    <ol className={cn("flex flex-col", className)}>
      {steps.map((step, i) => (
        <li key={step.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Circulo {...estado(i)} />
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "my-1 w-px flex-1 transition-colors",
                  i < current ? "bg-primary/40" : "bg-table-line",
                )}
              />
            )}
          </div>
          <div className={cn("pb-10", i === steps.length - 1 && "pb-0")}>
            <Rotulo indice={i} label={step.label} encendido={i <= current} />
          </div>
        </li>
      ))}
    </ol>
  )
}
