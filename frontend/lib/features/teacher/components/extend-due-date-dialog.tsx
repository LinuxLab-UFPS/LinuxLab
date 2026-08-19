"use client"

import { useState } from "react"
import { CalendarClock, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@shared/components/ui/dialog"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { notify } from "@shared/lib/toast"
import { formatBogotaDateTime, parseBogotaInput } from "@/lib/utils/dates"

export function ExtendDueDateDialog({
  open,
  currentDueDate,
  onSubmit,
  onOpenChange,
}: {
  open: boolean
  /** Fecha de cierre actual en ISO (o null si no hay). */
  currentDueDate: string | null
  onSubmit: (dueDate: string) => Promise<void>
  onOpenChange: (open: boolean) => void
}) {
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)

  const change = (next: boolean) => {
    if (!next) setValue("")
    onOpenChange(next)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) return
    const parsed = parseBogotaInput(value)
    if (Number.isNaN(parsed.getTime())) {
      notify.error(null, "La fecha no es válida")
      return
    }
    if (currentDueDate && parsed <= new Date(currentDueDate)) {
      notify.error(null, "La nueva fecha debe ser posterior a la fecha de cierre actual")
      return
    }
    setBusy(true)
    try {
      await onSubmit(parsed.toISOString())
      notify.success("Fecha de cierre extendida")
      setValue("")
      onOpenChange(false)
    } catch (err) {
      notify.error(err, "No se pudo extender la fecha de cierre")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-md">
        <div className="flex items-center justify-between gap-4 border-b border-table-line px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-primary" />
            Extender fecha de cierre
          </DialogTitle>
          <DialogClose
            aria-label="Cerrar"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="extend-due">Nueva fecha de cierre</Label>
            <Input
              id="extend-due"
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="border-table-line"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {currentDueDate
                ? `Cierre actual: ${formatBogotaDateTime(currentDueDate)}`
                : "La actividad no tiene fecha de cierre."}
            </p>
          </div>

          <button
            type="submit"
            disabled={busy || !value}
            className="w-full rounded-md border border-primary/40 bg-primary/15 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/25 disabled:opacity-60"
          >
            {busy ? "Extendiendo..." : "Extender fecha"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
