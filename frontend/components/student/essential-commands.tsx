"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Command, Download, Plus } from "lucide-react"
import { CollapsedPanelButton } from "@/components/shared/collapsed-panel-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  CHEAT_SHEET_SIZE,
  COMMANDS,
  findCommand,
  type EssentialCommand,
} from "@/lib/features/student/commands"
import { downloadCheatSheet } from "@/lib/features/student/cheat-sheet-pdf"

const PICK_KEY = "linuxlab:cheat-sheet"
const HIDDEN_KEY = "linuxlab:cheat-sheet-hidden"

/** La elección con la que arranca la hoja: los primeros esenciales. */
const DEFAULT_PICK = COMMANDS.slice(0, CHEAT_SHEET_SIZE).map((c) => c.name)

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
 * The cheat sheet under the terminal: four essential commands the student keeps
 * at hand. All the essentials are always available — the sheet does not depend
 * on which lessons have been read. The student can swap the four from the
 * picker, or hide the whole strip.
 */
export function EssentialCommands({ className }: { className?: string }) {
  const [picked, setPicked] = useState<string[] | null>(null)
  const [hidden, setHidden] = useState(false)
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    setPicked(read<string[]>(PICK_KEY, DEFAULT_PICK))
    setHidden(read<boolean>(HIDDEN_KEY, false))
  }, [])

  // La hoja siempre es la selección real; si se vació (quitaron los cuatro),
  // vuelve a sugerir los primeros esenciales.
  const shown = useMemo(() => {
    const chosen = (picked ?? [])
      .map(findCommand)
      .filter((c): c is EssentialCommand => c !== undefined)
    if (chosen.length > 0) return chosen.slice(0, CHEAT_SHEET_SIZE)
    return DEFAULT_PICK.map(findCommand).filter((c): c is EssentialCommand => c !== undefined)
  }, [picked])

  const toggleHidden = useCallback(() => {
    setHidden((prev) => {
      write(HIDDEN_KEY, !prev)
      return !prev
    })
  }, [])

  const toggleCommand = useCallback((name: string) => {
    setPicked((prev) => {
      const current = prev ?? []
      let next: string[]
      if (current.includes(name)) {
        // Quitar una elegida.
        next = current.filter((n) => n !== name)
      } else if (current.length >= CHEAT_SHEET_SIZE) {
        // Al tope: entra la nueva y sale la más antigua.
        next = [...current.slice(1), name]
      } else {
        next = [...current, name]
      }
      write(PICK_KEY, next)
      return next
    })
  }, [])

  // Aún no se ha leído el almacenamiento: nada que pintar todavía.
  if (picked === null) return null

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
        picked={picked ?? []}
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
      <p className="font-mono text-sm font-bold text-primary [text-shadow:var(--neon-text-shadow)]">
        {command.name}
        {command.args && <span className="ml-1 font-normal opacity-80">{command.args}</span>}
      </p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{command.description}</p>
    </>
  )

  const style = cn(
    "rounded-lg border p-2.5 text-left transition-colors",
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

/**
 * Picker for the cheat sheet. Every essential command is selectable: the sheet
 * is a reminder of what is at hand, and none of it is locked behind lessons.
 * The download takes the lot, because a printed sheet has no such problem.
 */
function CommandPicker({
  picked,
  open,
  onToggle,
  onOpenChange,
}: {
  picked: string[]
  open: boolean
  onToggle: (name: string) => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] gap-0 overflow-y-auto border-primary/50 shadow-[var(--neon-glow-strong)] sm:max-w-3xl">
        <div className="mb-5 flex flex-wrap items-center gap-3 pr-6">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-bold text-foreground">
              Comandos Esenciales
            </DialogTitle>
            <DialogDescription className="text-xs">
              Escoge hasta {CHEAT_SHEET_SIZE} para tenerlos debajo de tu terminal
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={downloadCheatSheet}
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Download className="h-4 w-4" />
            Descargar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COMMANDS.map((cmd) => (
            <CommandChip
              key={cmd.name}
              command={cmd}
              selected={picked.includes(cmd.name)}
              onClick={() => onToggle(cmd.name)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
