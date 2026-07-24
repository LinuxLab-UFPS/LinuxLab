"use client"

import { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

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
 * Envuelve el contenido de la leccion. Con la terminal CERRADA el contenido se
 * ensancha y se centra para aprovechar el espacio; con la terminal ABIERTA (que
 * ocupa la derecha) vuelve al ancho normal, a la izquierda.
 */
// With the terminal open the lesson fills the remaining width (left-aligned, not
// squeezed into a narrow column) and the text scales down so more fits.
const COMPACT_PROSE =
  "[&_h2]:text-xl [&_h3]:text-lg [&_p]:text-sm [&_ul]:text-sm [&_ol]:text-sm"

export function LessonContainer({ children }: { children: React.ReactNode }) {
  const { open } = useTerminalUI()
  return (
    <div
      className={cn(
        "p-6 transition-[max-width] duration-300 ease-out",
        open ? cn("max-w-none", COMPACT_PROSE) : "mx-auto max-w-6xl",
      )}
    >
      {children}
    </div>
  )
}
