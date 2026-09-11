"use client"

import { Terminal, X } from "lucide-react"
import { TerminalEmulator } from "@shared/components/terminal-emulator"
import { TerminalSettingsBar } from "@shared/components/terminal-settings-bar"
import { useTerminalPreferences } from "@shared/hooks/use-terminal-preferences"
import { Dialog, DialogContent, DialogTitle } from "@shared/components/ui/dialog"
import { cn } from "@shared/lib/utils"

/**
 * La terminal cuando no cabe como columna.
 *
 * Por debajo de 1280 la consola no puede ser una columna de 360 px al lado del
 * texto: no queda ancho para leer ni para trabajar. Se abre a pantalla completa
 * y se cierra, que en una tablet o un movil es como se usa de todos modos.
 *
 * La sesion vive fuera de React (`terminal-session.ts`), asi que cerrar el
 * modal no mata la PTY: al reabrirlo vuelve el historial y lo que estuviera
 * corriendo dentro.
 *
 * `acciones` es para lo que hay que tener a mano sin cerrar la terminal: en una
 * actividad, ir al directorio y reiniciar los archivos.
 */
export function TerminalModal({
  open,
  onOpenChange,
  acciones,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  acciones?: React.ReactNode
}) {
  const { fontSize, fontFamily, handleFontSize, handleFontFamily } = useTerminalPreferences()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-[#0d1117] p-0 sm:h-[92dvh] sm:w-[94vw] sm:max-w-4xl sm:rounded-xl sm:border"
      >
        {/* El titulo existe para los lectores de pantalla; la barra de arriba
            ya dice visualmente que es la terminal. */}
        <DialogTitle className="sr-only">Terminal</DialogTitle>

        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
          <Terminal className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm font-medium text-white/80">Terminal</span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar la terminal"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="shrink-0 border-b border-white/10 px-2 py-1.5">
          <TerminalSettingsBar
            fontSize={fontSize}
            fontFamily={fontFamily}
            onFontSizeChange={handleFontSize}
            onFontFamilyChange={handleFontFamily}
          />
        </div>

        {/* `min-h-0` para que xterm pueda medirse: sin el, el flex le da la
            altura del contenido y la consola se sale del modal. El padding es
            para que el texto no salga pegado al borde de la pantalla: sin marco
            alrededor, la primera columna quedaba literalmente en el filo. */}
        <div className="min-h-0 flex-1 px-3 py-2">
          <TerminalEmulator className="h-full" fontSize={fontSize} fontFamily={fontFamily} />
        </div>

        {acciones ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/10 px-3 py-2">
            {acciones}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/** El disparador: solo el icono, para que quepa en una esquina. */
export function BotonTerminal({
  onClick,
  className,
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abrir la terminal"
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all neon-glow hover:neon-glow-strong",
        className ?? "fixed bottom-5 right-5 z-40",
      )}
    >
      <Terminal className="h-5 w-5" />
    </button>
  )
}
