"use client"

import { FloatingTerminal } from "@shared/components/floating-terminal"
import { useTerminalUI } from "@shared/components/terminal-ui"

/**
 * El boton de la terminal, incrustado en el texto de la guia.
 *
 * Es literalmente el mismo componente que vive en la esquina, con la posicion
 * cambiada: comparte el estado por `useTerminalUI`, asi que abre y cierra la
 * misma terminal. Enseñar un boton parecido en vez del de verdad seria enseñar
 * otra cosa.
 */
export function TerminalDemoButton() {
  const { open, setOpen } = useTerminalUI()
  return (
    <div className="my-6 flex justify-center">
      <FloatingTerminal onClick={() => setOpen(!open)} className="static" />
    </div>
  )
}
