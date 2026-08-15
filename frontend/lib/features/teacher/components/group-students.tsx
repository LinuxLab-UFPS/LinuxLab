"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePanel, TableEmptyState } from "@shared/components/data-table"
import { NeonProgress } from "@shared/components/neon-progress"
import type { GroupProgressSummary } from "@/lib/features/teacher/types"
import type { EnrollmentStudent } from "@/lib/features/auth/types"

/**
 * Los estudiantes del curso con su avance. La tabla scrollea por dentro para que
 * la pagina no crezca a lo alto por muchos inscritos que haya.
 */
export function GroupStudents({
  students,
  summary,
  query,
}: {
  students: EnrollmentStudent[]
  summary: GroupProgressSummary
  query: string
}) {
  const progressOf = new Map(summary.rows.map((row) => [row.student.id, row]))
  const q = query.trim().toLowerCase()
  const visible = students.filter(
    (student) =>
      !q ||
      student.name.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q),
  )

  return (
    <section>
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
            {students.length === 0
              ? "No hay estudiantes inscritos en este curso."
              : "Ningún estudiante coincide con la búsqueda."}
          </TableEmptyState>
        )}
      </div>
      </TablePanel>

    </section>
  )
}
