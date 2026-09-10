"use client"

import { createContext, useContext, useState } from "react"
import { cn } from "@shared/lib/utils"
import { COMPACT_PROSE } from "@shared/lib/content/prose"

interface TerminalUIValue {
  open: boolean
  setOpen: (v: boolean) => void
}

const TerminalUIContext = createContext<TerminalUIValue | null>(null)

/**
 * Comparte el estado abierto/cerrado de la terminal del curso, para que el
 * contenido de la leccion pueda ajustar su ancho segun si la terminal esta
 * ocupando la derecha o no.
 */
export function TerminalUIProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <TerminalUIContext.Provider value={{ open, setOpen }}>
      {children}
    </TerminalUIContext.Provider>
  )
}

export function useTerminalUI(): TerminalUIValue {
  const ctx = useContext(TerminalUIContext)
  if (!ctx) {
    throw new Error("useTerminalUI must be used within <TerminalUIProvider>.")
  }
  return ctx
}

/**
 * Envuelve el contenido de la leccion y le pone un techo al ancho.
 *
 * Antes era `max-w-none`: la leccion no pedia un ancho, se quedaba con lo que
 * sobrara despues de repartir la barra de contenidos y la consola. Medido, eso
 * daba 95 caracteres por linea con la terminal cerrada en CUALQUIER resolucion,
 * y 45 con la terminal abierta a 1280. Lo comodo para leer esta entre 45 y 75,
 * asi que el texto solo caia dentro por casualidad.
 *
 * Ahora pide su ancho y lo que sobra queda como margen. Son dos valores porque
 * con la terminal abierta la letra baja de 18 a 16 px (`COMPACT_PROSE`), y el
 * mismo ancho en pixeles daria mas caracteres por linea: 42rem a 18px y 36rem a
 * 16px salen los dos alrededor de 73.
 */
export function LessonContainer({ children }: { children: React.ReactNode }) {
  const { open } = useTerminalUI()
  return (
    <div
      className={cn(
        "mx-auto px-4 pb-16 pt-11",
        open ? cn("max-w-[36rem]", COMPACT_PROSE) : "max-w-[42rem]",
      )}
    >
      {children}
    </div>
  )
}
