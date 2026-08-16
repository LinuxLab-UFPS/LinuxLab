"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Command, Download, Plus, X } from "lucide-react"
import { CollapsedPanelButton } from "@shared/components/collapsed-panel-button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@shared/components/ui/dialog"
import { cn } from "@shared/lib/utils"
import { useLessonProgress } from "@/lib/features/student/progress"
import {
  CHEAT_SHEET_SIZE,
  COMMANDS,
  findCommand,
  type EssentialCommand,
} from "@/lib/features/student/commands"
import { downloadCheatSheet } from "@/lib/features/student/cheat-sheet-pdf"
import { notify } from "@shared/lib/toast"

const PICK_KEY = "linuxlab:cheat-sheet"
const HIDDEN_KEY = "linuxlab:cheat-sheet-hidden"

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage blocked: the choice just won't survive the session.
  }
}

/**
 * The cheat sheet under the terminal: four commands the student keeps at hand.
 *
 * Only commands from lessons already read are offered — the sheet grows with the
 * course instead of spoiling what comes later. The student can swap the four
 * from the picker, or hide the whole strip.
 */
export function EssentialCommands({ className }: { className?: string }) {
  const { isRead } = useLessonProgress()
  const [picked, setPicked] = useState<string[] | null>(null)
  const [hidden, setHidden] = useState(false)
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    // Patron aceptado: sincronizar estado con localStorage una sola vez al
    // montar (la regla del setState en effects no aplica a lecturas unicas).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicked(read<string[]>(PICK_KEY, []))
     
    setHidden(read<boolean>(HIDDEN_KEY, false))
  }, [])

  const learned = useMemo(
    () => COMMANDS.filter((c) => isRead(c.topicNumber, c.subtopicId)),
    [isRead],
  )

  // Sin elección propia, la hoja se llena sola con lo más reciente que aprendió.
  const shown = useMemo(() => {
    if (picked === null) return []
    const chosen = picked
      .map(findCommand)
      .filter((c): c is EssentialCommand => c !== undefined && learned.includes(c))
    if (chosen.length > 0) return chosen.slice(0, CHEAT_SHEET_SIZE)
    return learned.slice(-CHEAT_SHEET_SIZE)
  }, [picked, learned])

  const toggleHidden = useCallback(() => {
    setHidden((prev) => {
      write(HIDDEN_KEY, !prev)
      return !prev
    })
  }, [])

  const toggleCommand = useCallback((name: string) => {
    setPicked((prev) => {
      const current = prev ?? []
      const next = current.includes(name)
        ? current.filter((n) => n !== name)
        : current.length >= CHEAT_SHEET_SIZE
          ? current
          : [...current, name]
      write(PICK_KEY, next)
      return next
    })
  }, [])

  // Nada aprendido todavía: no hay hoja que mostrar ni que ofrecer.
  if (picked === null || learned.length === 0) return null

  return (
    <div className={cn("flex items-start gap-2", className)}>
      {/* La hoja se despliega hacia abajo en vez de aparecer de golpe. La fila
          de la rejilla va de 0fr a 1fr, que es la única forma de animar un alto
          que no se conoce de antemano; el recorte lo hace la caja de dentro. */}
      <div
        className={cn(
          "grid flex-1 transition-all duration-300 ease-out",
          hidden ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {shown.map((cmd) => (
              <CommandChip key={cmd.name} command={cmd} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <CollapsedPanelButton
          tone="primary"
          label={hidden ? "Mostrar comandos esenciales" : "Ocultar comandos esenciales"}
          icon={Command}
          onClick={toggleHidden}
          active={!hidden}
        />
        {!hidden && (
          <CollapsedPanelButton
            tone="primary"
            label="Escoger comandos"
            icon={Plus}
            onClick={() => setPicking(true)}
          />
        )}
      </div>

      <CommandPicker
        learned={learned}
        picked={shown.map((c) => c.name)}
        open={picking}
        onToggle={toggleCommand}
        onOpenChange={setPicking}
      />
    </div>
  )
}

function CommandChip({
  command,
  selected,
  onClick,
}: {
  command: EssentialCommand
  selected?: boolean
  onClick?: () => void
}) {
  const body = (
    <>
      {/* `break-words`: el argumento salta de linea cuando no cabe al lado del
          comando, y se parte si el solo ya es mas ancho que la tarjeta. Sin
          esto, `unzip <archivo.zip>` se salia por el borde derecho. */}
      <p className="font-mono text-sm font-bold break-words text-primary [text-shadow:var(--neon-text-shadow)]">
        {command.name}
        {command.args && <span className="ml-1 font-normal opacity-80">{command.args}</span>}
      </p>
      <p className="mt-1 text-xs leading-snug break-words text-muted-foreground">
        {command.description}
      </p>
    </>
  )

  // `min-w-0`: una celda de rejilla no baja de su contenido por defecto, asi que
  // un comando largo ensanchaba su columna y la tira entera se desbordaba.
  const style = cn(
    "min-w-0 rounded-lg border p-2.5 text-left transition-colors",
    selected === false
      ? "border-border bg-transparent hover:border-primary/40"
      : "border-primary/40 bg-primary/10",
  )

  return onClick ? (
    <button type="button" onClick={onClick} className={style}>
      {body}
    </button>
  ) : (
    <div className={style}>{body}</div>
  )
}


/** El chip de un comando aun no aprendido: se ve, pero no se puede escoger. */
function LockedChip({ command }: { command: EssentialCommand }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 p-2.5 text-left opacity-45">
      <p className="font-mono text-sm font-bold break-words text-muted-foreground">
        {command.name}
        {command.args && <span className="ml-1 font-normal opacity-80">{command.args}</span>}
      </p>
      <p className="mt-1 text-xs leading-snug break-words text-muted-foreground">
        {command.description}
      </p>
    </div>
  )
}

/**
 * Picker for the cheat sheet.
 *
 * It lists every command the course teaches, not just the ones already learned:
 * seeing what is still ahead is part of the map. The pending ones are shown but
 * cannot be picked — the sheet is a reminder of what you know, not a spoiler.
 * The download takes the lot, because a printed sheet has no such problem.
 */
function CommandPicker({
  learned,
  picked,
  open,
  onToggle,
  onOpenChange,
}: {
  learned: EssentialCommand[]
  picked: string[]
  open: boolean
  onToggle: (name: string) => void
  onOpenChange: (open: boolean) => void
}) {
  const pending = COMMANDS.filter((command) => !learned.includes(command))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Cabecera fija y cuerpo con scroll propio, en vez de un bloque unico
          que se desplaza entero. Antes la equis iba `absolute` dentro de esa
          caja: se movia con la lista —que es larga— y aparecia flotando a
          media altura, desalineada de todo. Ahora vive en una barra, a la
          misma linea que «Descargar», y no se va a ninguna parte. */}
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden border-primary/50 p-0 shadow-[var(--neon-glow-strong)] sm:max-w-3xl"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              Comandos Esenciales
            </DialogTitle>
            <DialogDescription className="text-xs">
              Escoge hasta {CHEAT_SHEET_SIZE} para tenerlos debajo de tu terminal
              {picked.length > 0 && (
                <span className="text-foreground">
                  {" "}
                  · llevas {picked.length}
                </span>
              )}
            </DialogDescription>
          </div>

          {/* En gris: el rojo lo llevan las tarjetas de comando, que son lo que
              hay que mirar aqui. Un boton secundario no puede gritar mas. */}
          <button
            type="button"
            onClick={() => {
              downloadCheatSheet()
              notify.info("Descargando el PDF de comandos…")
            }}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-secondary px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
          >
            <Download className="h-4 w-4" />
            Descargar
          </button>

          <DialogClose className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:ring-2 focus:ring-ring focus:outline-hidden">
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {learned.map((cmd) => (
              <CommandChip
                key={cmd.name}
                command={cmd}
                selected={picked.includes(cmd.name)}
                onClick={() => onToggle(cmd.name)}
              />
            ))}
          </div>

          {pending.length > 0 && (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Aún no los has visto
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {pending.map((cmd) => (
                  <LockedChip key={cmd.name} command={cmd} />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
