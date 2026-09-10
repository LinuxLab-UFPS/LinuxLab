"use client"

import { FloatingTerminal } from "@shared/components/floating-terminal"
import { TerminalPanel } from "@shared/components/terminal-panel"
import { BotonTerminal, TerminalModal } from "@shared/components/terminal-modal"
import { useTerminalUI } from "@shared/components/terminal-ui"
import { useEsCompleta } from "@shared/hooks/use-talla"

/**
 * La terminal de la vista de contenidos, en sus dos formas.
 *
 * Desde 1280 es una columna al lado de la leccion, que es donde hay ancho para
 * las dos cosas. Por debajo se abre como modal a pantalla completa: antes
 * directamente no existia, y quien entraba desde una tablet o un movil se
 * quedaba sin terminal aunque el resto del curso si le funcionara.
 *
 * La decision se toma en JS y no con clases porque el modal se monta en un
 * portal fuera de este arbol: un `xl:hidden` en el padre no lo alcanzaria y se
 * abririan los dos a la vez.
 */
export function GroupTerminal() {
  const { open, setOpen } = useTerminalUI()
  const completa = useEsCompleta()

  // Hasta saber la talla no se pinta nada: adivinar aqui hace que la terminal
  // parpadee de una forma a otra al cargar.
  if (completa === undefined) return null

  if (completa) {
    return open ? (
      <TerminalPanel onClose={() => setOpen(false)} />
    ) : (
      <FloatingTerminal onClick={() => setOpen(true)} />
    )
  }

  return (
    <>
      {!open && <BotonTerminal onClick={() => setOpen(true)} />}
      <TerminalModal open={open} onOpenChange={setOpen} />
    </>
  )
}
