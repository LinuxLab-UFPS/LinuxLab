"use client"

import { TerminalFrame } from "@shared/components/terminal-frame"
import { TerminalEmulator } from "@shared/components/terminal-emulator"
import { TerminalSettingsBar } from "@shared/components/terminal-settings-bar"
import { useTerminalPreferences } from "@shared/hooks/use-terminal-preferences"

/* Sin la tira de comandos esenciales, que si esta en la pagina de la terminal.
   Aqui competia con la leccion que se esta leyendo al lado: la consola se abre
   para probar lo que el texto acaba de explicar, y debajo aparecian cuatro
   comandos que casi nunca eran esos. La hoja sigue estando a un clic desde la
   pagina de la terminal. */
export function TerminalPanel({ onClose }: { onClose: () => void }) {
  const { fontSize, fontFamily, handleFontSize, handleFontFamily } = useTerminalPreferences()

  return (
    // Altura fija y pegada: la terminal no puede irse de la pantalla mientras
    // se lee la leccion, y xterm necesita un alto definido para ajustarse.
    // `top-0` porque se ancla a su contenedor con scroll —el <main> de la pagina
    // del curso—, que ya empieza debajo de la cabecera; descontar ahi los 66px
    // otra vez la mandaba media cabecera hacia abajo.
    //
    // El alto va contra el viewport y no en `h-full`: la fila que la contiene
    // alinea a `items-start`, asi que no la estira y un `h-full` se resolvia
    // contra una altura automatica, dejandola a media pantalla. Con esto ocupa
    // todo lo que no es cabecera y el `py-4` reparte el mismo margen arriba y
    // abajo.
    <aside className="sticky top-0 flex h-[calc(100vh-66px)] w-[38%] min-w-[360px] shrink-0 flex-col gap-3 bg-background py-4">
      <TerminalFrame
        className="min-h-0 flex-1"
        onClose={onClose}
        toolbar={
          <TerminalSettingsBar
            fontSize={fontSize}
            fontFamily={fontFamily}
            onFontSizeChange={handleFontSize}
            onFontFamilyChange={handleFontFamily}
          />
        }
      >
        <TerminalEmulator fontSize={fontSize} fontFamily={fontFamily} />
      </TerminalFrame>
    </aside>
  )
}
