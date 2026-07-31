"use client"

import { Archive, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"
import type { Group } from "@/lib/features/teacher/types"

/**
 * Confirmacion antes de archivar un curso. Archivar es destructivo (se pierde
 * el entorno y el progreso), asi que se pide confirmacion explicita; restaurar
 * no la necesita y por eso no pasa por aqui.
 *
 * El curso llega por prop en vez de un booleano `open` para que el contenido no
 * parpadee: si es null no hay dialogo.
 */
export function ArchiveCourseDialog({
  group,
  archiving,
  onConfirm,
  onCancel,
}: {
  group: Group | null
  archiving: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
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
              <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Archive className="h-5 w-5" />
              </span>
              <p className="truncate font-semibold text-foreground">{group.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {group.studentCount} estudiantes · {group.activityCount} actividades
              </p>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Se borrará el entorno de la terminal y el progreso. Los estudiantes perderán
                acceso al curso.
              </p>

              <button
                type="button"
                onClick={onConfirm}
                disabled={archiving}
                className="mt-5 w-full rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/20 disabled:opacity-60"
              >
                {archiving ? "Archivando..." : "Sí, archivar"}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
