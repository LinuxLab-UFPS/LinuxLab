"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

/**
 * Las acciones de la actividad, para poder pintarlas en otro sitio.
 *
 * Con la terminal como modal, "Ir al directorio" y "Reiniciar archivos" quedan
 * detras del modal justo cuando mas falta hacen. Tienen que estar dentro, pero
 * su logica vive en el panel de la actividad y duplicarla ahi seria tener dos
 * reinicios que mantener.
 *
 * Asi que el panel las publica aqui y el modal las consume. Es el mismo motivo
 * por el que existe `terminal-input.ts`: dos componentes hermanos que no
 * comparten mas ancestro util que la pagina entera.
 */
interface AccionesActividad {
  acciones: React.ReactNode | null
  publicar: (nodo: React.ReactNode | null) => void
}

const Ctx = createContext<AccionesActividad>({ acciones: null, publicar: () => {} })

export function AccionesActividadProvider({ children }: { children: React.ReactNode }) {
  const [acciones, setAcciones] = useState<React.ReactNode | null>(null)
  const publicar = useCallback((nodo: React.ReactNode | null) => setAcciones(nodo), [])
  const valor = useMemo(() => ({ acciones, publicar }), [acciones, publicar])
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useAccionesActividad() {
  return useContext(Ctx)
}
