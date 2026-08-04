"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { TablePanel, TableEmptyState } from "@/components/shared/data-table"
import { ActionButton } from "@/components/shared/action-button"
import { NeonProgress } from "@/components/shared/neon-progress"
import { AddStudentDialog } from "@/components/teacher/add-student-dialog"
import { addStudent } from "@/lib/features/teacher/data"
import type { GroupProgressSummary } from "@/lib/features/teacher/types"
import type { EnrollmentStudent } from "@/lib/features/auth/types"

/**
 * Los estudiantes del curso con su avance. La tabla scrollea por dentro para que
 * la página no crezca a lo alto por muchos inscritos que haya.
 */
export function GroupStudents({
  groupId,
  students,
  summary,
  archived,
}: {
  groupId: string
  /** Las matrículas del curso, que son la fuente de la lista. */
  students: EnrollmentStudent[]
  /** Avance por estudiante, cuando el backend lo expone. */
  summary: GroupProgressSummary
  /** Un curso desactivado es solo histórico: no se le agregan estudiantes. */
  archived?: boolean
}) {
  const [rows, setRows] = useState<EnrollmentStudent[]>(students)
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (student: Omit<EnrollmentStudent, "id">) => {
    setBusy(true)
    setError(null)
    try {
      const created = await addStudent(groupId, student)
      setRows((prev) => [...prev, created])
      setAdding(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agregar el estudiante.")
    } finally {
      setBusy(false)
    }
  }

  const progressOf = new Map(summary.rows.map((row) => [row.student.id, row]))
  const q = query.trim().toLowerCase()
  const visible = rows.filter(
    (student) =>
      !q ||
      student.name.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q),
  )

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar estudiante por nombre o correo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-table-line pl-9"
          />
        </div>

        {!archived && (
          <ActionButton
            tone="primary"
            onClick={() => {
              setError(null)
              setAdding(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Agregar estudiante
          </ActionButton>
        )}
      </div>

      <TablePanel>
        {/* El scroll vive dentro del panel y el encabezado se queda fijo arriba. */}
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead>Estudiante</TableHead>
                <TableHead className="w-44">Cuenta Linux</TableHead>
                <TableHead className="w-40">Progreso</TableHead>
                <TableHead className="w-32">Actividades</TableHead>
                <TableHead className="w-28">Promedio</TableHead>
                <TableHead className="w-44">Última conexión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((student) => {
                const progress = progressOf.get(student.id)
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <span className="block text-sm font-medium text-foreground">
                        {student.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">{student.email}</span>
                    </TableCell>
                    <TableCell>
                      {student.linuxUsername ? (
                        <>
                          <span className="block font-mono text-sm text-sky-500">
                            {student.linuxUsername}
                          </span>
                          {!student.linuxProvisioned && (
                            <span className="mt-0.5 block text-xs text-amber-500">
                              Creando cuenta...
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin cuenta</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <NeonProgress value={progress?.progress ?? 0} className="w-28" />
                      <span className="mt-1 block font-mono text-xs text-primary">
                        {progress?.progress ?? 0}%
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-amber-500">
                      {progress?.activitiesDone ?? 0}/{progress?.activitiesTotal ?? 0}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-success">
                      {progress?.averageScore?.toFixed(1) ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {progress?.lastActivity ?? "Sin conexión"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {visible.length === 0 && (
            <TableEmptyState>
              {rows.length === 0
                ? "No hay estudiantes inscritos en este curso."
                : "Ningún estudiante coincide con la búsqueda."}
            </TableEmptyState>
          )}
        </div>
      </TablePanel>

      <AddStudentDialog
        open={adding}
        busy={busy}
        error={error}
        onSubmit={submit}
        onOpenChange={(open) => {
          setAdding(open)
          if (!open) setError(null)
        }}
      />
    </section>
  )
}
