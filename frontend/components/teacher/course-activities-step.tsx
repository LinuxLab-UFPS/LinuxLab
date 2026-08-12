"use client"

import { useEffect, useState } from "react"
import { FileCode, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePanel, TableEmptyState } from "@/components/shared/data-table"
import { ActionButton } from "@/components/shared/action-button"
import { listBankActivities } from "@/lib/features/teacher/data"
import { getTopic } from "@/lib/features/shared/temario"
import type { Activity, Difficulty } from "@/lib/features/teacher/types"

/** Mismos colores que la tabla del banco, para que se lean igual en las dos. */
const DIFICULTAD: Record<Difficulty, { label: string; className: string }> = {
  basic: { label: "Fácil", className: "bg-success/10 text-success border-success/30" },
  intermediate: { label: "Intermedio", className: "bg-warning/10 text-warning border-warning/30" },
  advanced: { label: "Difícil", className: "bg-danger/10 text-danger border-danger/30" },
}

/**
 * Lo que va a aparecer en el curso. El banco viene fijo y no se descarta, así
 * que aquí sólo se muestra: sirve para que el docente sepa con qué cuenta antes
 * de publicar.
 */
export function CourseActivitiesStep() {
  const [filas, setFilas] = useState<Activity[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    listBankActivities()
      .then((banco) => vivo && setFilas(banco))
      .catch((e) => vivo && setError(e instanceof Error ? e.message : "No se pudieron cargar"))
    return () => {
      vivo = false
    }
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {filas === null ? "Cargando…" : `${filas.length} actividades en el curso`}
        </p>
        <ActionButton tone="amber" disabled>
          <Plus className="h-4 w-4" />
          Crear actividad
        </ActionButton>
      </div>

      {error && (
        <p className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {filas === null && !error ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TablePanel>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Actividad</TableHead>
                <TableHead className="w-48">Tema</TableHead>
                <TableHead className="w-36">Dificultad</TableHead>
                <TableHead className="w-44">Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filas ?? []).map((a) => {
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium text-foreground">{a.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getTopic(a.topicNumber)?.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      {a.difficulty ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            DIFICULTAD[a.difficulty].className,
                          )}
                        >
                          {DIFICULTAD[a.difficulty].label}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.evaluationType === "manual" ? "Revisión manual" : "Autoevaluación"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filas !== null && filas.length === 0 && (
            <TableEmptyState>Todavía no hay actividades.</TableEmptyState>
          )}
        </TablePanel>
      )}
    </div>
  )
}
