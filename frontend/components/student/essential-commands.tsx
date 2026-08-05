"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Eye, EyeOff, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useLessonProgress } from "@/lib/features/student/progress"
import {
  CHEAT_SHEET_SIZE,
  COMMANDS,
  findCommand,
  type EssentialCommand,
} from "@/lib/features/student/commands"

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
      <div className="flex-1">
        {hidden ? (
          <p className="py-3 text-xs text-muted-foreground">Comandos esenciales ocultos.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {shown.map((cmd) => (
              <CommandChip key={cmd.name} command={cmd} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        <IconButton
          label={hidden ? "Mostrar comandos esenciales" : "Ocultar comandos esenciales"}
          onClick={toggleHidden}
        >
          {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </IconButton>
        {!hidden && (
          <IconButton label="Escoger comandos" onClick={() => setPicking(true)}>
            <Plus className="h-4 w-4" />
          </IconButton>
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

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded-md p-1 text-primary/70 transition-colors hover:text-primary"
    >
      {children}
    </button>
  )
}

/** Picker for the four commands, limited to what the student already learned. */
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] gap-0 overflow-y-auto border-primary/50 shadow-[var(--neon-glow-strong)] sm:max-w-3xl">
        <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 pr-6">
          <DialogTitle className="text-lg font-bold text-primary [text-shadow:var(--neon-text-shadow)]">
            Comandos Esenciales
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escoge hasta {CHEAT_SHEET_SIZE} para tenerlos debajo de tu terminal
          </DialogDescription>
        </div>

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
      </DialogContent>
    </Dialog>
  )
}
