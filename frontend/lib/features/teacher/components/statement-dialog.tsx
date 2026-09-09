"use client"

import { useState } from "react"
import { Eye } from "lucide-react"
import { Markdown } from "@shared/components/markdown"
import { DENSE_PROSE } from "@shared/lib/content/prose"
import { cn } from "@shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"

/**
 * El enunciado de la actividad, tal como lo lee el estudiante.
 *
 * La ficha de la actividad mostraba modalidad, tipo, dificultad, puntuacion,
 * fecha y directorio, pero no el enunciado: el docente tenia que abrir la
 * actividad como estudiante para leer lo que habia escrito. Va en un dialogo
 * porque es texto largo y la ficha son filas de una linea.
 *
 * El markdown pasa por el `Markdown` compartido y no por `react-markdown` a
 * secas: es el que trae las tablas, el HTML embebido y el tratamiento de los
 * bloques de codigo. `DENSE_PROSE` lo baja de escala, porque el dialogo es
 * tan estrecho como el panel de la actividad y no una columna de lectura.
 *
 * La pagina que lo usa es un componente de servidor, asi que el dialogo vive
 * aparte, como `ExtendDueDateButton`.
 */
export function StatementDialog({
  title,
  statement,
}: {
  title: string
  statement: string
}) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm text-primary transition-colors hover:bg-primary/10"
      >
        <Eye className="h-3.5 w-3.5" />
        Ver
      </button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className={cn("max-h-[80vh] max-w-2xl overflow-y-auto", DENSE_PROSE)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {statement.trim() ? (
            <div className="lesson-prose [&>*:first-child]:mt-0">
              <Markdown>{statement}</Markdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Esta actividad no tiene enunciado.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
