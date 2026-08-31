"use client"

import { FloatingTerminal } from "@shared/components/floating-terminal"
import { TerminalPanel } from "@shared/components/terminal-panel"
import { useTerminalUI } from "@shared/components/terminal-ui"

/**
 * The floating terminal button + slide-in panel for the content view.
 *
 * En movil no hay terminal: es una maquina Linux de verdad, con teclado y
 * rutas, y en un telefono no se puede trabajar con ella. El boton se esconde
 * con `md:hidden` y no con JS porque esto se pinta en el servidor, y el panel
 * ademas ocupa una columna de 360px que dejaria la leccion sin ancho.
 */
export function GroupTerminal() {
  const { open, setOpen } = useTerminalUI()

  return (
    <>
      {open && (
        <div className="hidden md:contents">
          <TerminalPanel onClose={() => setOpen(false)} />
        </div>
      )}
      {!open && (
        <div className="hidden md:block">
          <FloatingTerminal onClick={() => setOpen(true)} />
        </div>
      )}
    </>
  )
}
