"use client"

import { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"
import { COMPACT_PROSE } from "@/lib/features/shared/prose"

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
export function LessonContainer({ children }: { children: React.ReactNode }) {
  const { open } = useTerminalUI()
  return (
    <div className={cn("max-w-none px-4 pb-16 pt-6", open && COMPACT_PROSE)}>{children}</div>
  )
}
