"use client"

import { Archive, Trash2, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@shared/components/ui/dialog"
import { cn } from "@shared/lib/utils"
import type { Group } from "@/lib/features/teacher/types"

export type CourseAction = "deactivate" | "delete"

const ACTION: Record<
  CourseAction,
  {
    icon: React.ComponentType<{ className?: string }>
    message: string
    confirm: string
    pending: string
    box: string
    button: string
  }
> = {
  deactivate: {
    icon: Archive,
    message:
      "Se eliminará el entorno de la terminal (usuarios y carpeta del grupo) y los estudiantes perderán acceso al curso. El histórico del curso se conserva.",
    confirm: "Sí, desactivar",
    pending: "Desactivando...",
    box: "bg-amber-500/10 text-amber-500",
    button:
      "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
  },
  delete: {
    icon: Trash2,
    message:
      "El curso y su histórico se borrarán para siempre. Esta acción no se puede deshacer.",
    confirm: "Sí, eliminar",
    pending: "Eliminando...",
    box: "bg-danger/10 text-danger",
    button: "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
  },
}

/**
 * Confirmacion para las dos acciones destructivas sobre un curso: desactivarlo
 * (se pierde el entorno y el progreso) y eliminarlo (se borra el historico).
 *
 * El curso llega por prop en vez de un booleano `open` para que el contenido no
 * parpadee al cerrarse: si es null no hay dialogo.
 */
export function ConfirmCourseDialog({
  group,
  action,
  busy,
  onConfirm,
  onCancel,
}: {
  group: Group | null
  action: CourseAction
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const cfg = ACTION[action]
  const Icon = cfg.icon

  return (
    <Dialog open={group !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-md">
        {group && (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-table-line px-4 py-3">
              <DialogTitle className="truncate text-sm font-semibold">
                ¿Estás seguro?
              </DialogTitle>
              <DialogClose
                aria-label="Cerrar"
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <X className="h-4 w-4" />
              </DialogClose>
            </div>

            <div className="px-6 py-5 text-center">
              <span
                className={cn(
                  "mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg",
                  cfg.box,
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="truncate font-semibold text-foreground">{group.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {group.studentCount} estudiantes · {group.activityCount} actividades
              </p>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {cfg.message}
              </p>

              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={cn(
                  "mt-5 w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                  cfg.button,
                )}
              >
                {busy ? cfg.pending : cfg.confirm}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
