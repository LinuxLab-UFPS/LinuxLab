"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useTerminalUI } from "@shared/components/terminal-ui"

const CLAVE = "linuxlab:contenidos-plegados"

/**
 * Si la barra de contenidos ocupa su columna o se pliega a la barra de arriba.
 *
 * Lo consumen dos primos: `GroupSidebar`, que cuelga de la pagina del curso, y
 * `SidebarMovil`, que vive dentro de `ContentArea`. No comparten mas ancestro
 * util que la pagina entera, de ahi el contexto.
 *
 * `null` es "decide la pantalla". Solo deja de serlo cuando el estudiante pulsa
 * uno de los dos botones, y entonces su decision manda y se recuerda. Es el
 * mismo trato que la columna de actividades sugeridas de la terminal.
 */
interface ContenidosValue {
  /** `true` plegada, `false` en columna, `null` mientras mande la pantalla. */
  plegada: boolean | null
  plegar: (v: boolean) => void
}

const Ctx = createContext<ContenidosValue | null>(null)

export function ContenidosProvider({ children }: { children: React.ReactNode }) {
  /* Arranca en `null` tambien mientras se lee el almacenamiento: pintar una
     preferencia inventada y corregirla despues es lo que hace que la barra
     salte de sitio al cargar. */
  const [plegada, setPlegada] = useState<boolean | null>(null)

  useEffect(() => {
    // Lectura unica al montar (patron aceptado).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlegada(() => {
      try {
        const guardado = localStorage.getItem(CLAVE)
        return guardado === null ? null : guardado === "true"
      } catch {
        return null
      }
    })
  }, [])

  const plegar = useCallback((v: boolean) => {
    setPlegada(v)
    try {
      localStorage.setItem(CLAVE, String(v))
    } catch {
      // Almacenamiento bloqueado: la decision dura lo que dure la sesion.
    }
  }, [])

  const valor = useMemo(() => ({ plegada, plegar }), [plegada, plegar])
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

function useContenidos(): ContenidosValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useContenidos debe usarse dentro de <ContenidosProvider>.")
  return ctx
}

export { useContenidos }

/**
 * Las clases de las dos caras de la barra, para que digan siempre lo contrario.
 *
 * Se resuelve con clases y no midiendo el ancho en JS a proposito: el cambio de
 * columna a barra tiene que ocurrir en la primera pintura. Con un hook de
 * medida habria que esperar al montaje y la barra saltaria al cargar, que es el
 * defecto que ya se corrigio una vez en `GroupTerminal`.
 *
 * El corte automatico es `2xl` (1536) y sale de medir el parrafo: con las tres
 * columnas, a 1600 la lectura da 70 caracteres por linea y a 1440 da 58. Ahi es
 * donde deja de caber. Con la terminal cerrada sobra sitio y basta `xl`.
 */
export function useClasesContenidos(): { columna: string; barra: string } {
  const { plegada } = useContenidos()
  const { open } = useTerminalUI()

  if (plegada === true) return { columna: "hidden", barra: "" }
  if (plegada === false) return { columna: "hidden xl:block", barra: "xl:hidden" }
  return open
    ? { columna: "hidden 2xl:block", barra: "2xl:hidden" }
    : { columna: "hidden xl:block", barra: "xl:hidden" }
}
