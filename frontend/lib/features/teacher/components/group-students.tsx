"use client"

import { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePanel, TableEmptyState, TablePagination } from "@shared/components/data-table"
import { ProgressBar } from "@shared/components/progress-indicators"
import { syllabus } from "@shared/lib/content/temario"
import { timeAgo } from "@/lib/utils/dates"
import { StudentProgressDialog } from "@/lib/features/teacher/components/student-progress-dialog"
import type { EnrollmentStudent } from "@/lib/features/auth/types"
import type { StudentProgress } from "@/lib/models/groups"
import type { Topic } from "@/lib/features/student/types"

const PAGE_SIZE = 10

/**
 * Los estudiantes del curso con su progreso de contenidos. La columna
 * ESTUDIANTE agrupa nombre y email; PROGRESO muestra la barra con el % total
 * sobre los 12 temas del temario. Cada fila es cliqueable y abre el modal de
 * detalle (dona + desglose por tema).
 */
export function GroupStudents({
  students,
  rows,
  query,
}: {
  students: EnrollmentStudent[]
  rows: StudentProgress[]
  query: string
}) {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<StudentProgress | null>(null)

  const progressById = useMemo(
    () => new Map(rows.map((r) => [r.student.id, r])),
    [rows],
  )

  const q = query.trim().toLowerCase()
  const visible = students.filter(
    (student) =>
      !q ||
      student.name.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q) ||
      (student.code ?? "").toLowerCase().includes(q),
  )
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = visible.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  const topics: Topic[] = syllabus

  return (
    <section>
      <TablePanel>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead className="w-36">Usuario</TableHead>
                <TableHead className="w-52">Progreso</TableHead>
                <TableHead className="w-40">Última conexión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((student) => {
                const row = progressById.get(student.id)
                const progress = row?.progress ?? 0
                return (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer transition-colors hover:bg-foreground/[0.04]"
                    onClick={() => row && setSelected(row)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm text-muted-foreground">
                        {student.code ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block text-sm font-medium text-foreground">
                        {student.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {student.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {student.linuxUsername ? (
                        <span className="font-mono text-sm text-primary">
                          {student.linuxUsername}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin cuenta</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={progress} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.lastLogin ? timeAgo(student.lastLogin) : "Sin conexión"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {visible.length === 0 && (
          <TableEmptyState>
            {students.length === 0
              ? "No hay estudiantes inscritos en este curso."
              : "Ningún estudiante coincide con la búsqueda."}
          </TableEmptyState>
        )}
      </TablePanel>

      {visible.length > 0 && (
        <TablePagination
          page={page_}
          totalPages={totalPages}
          onChange={setPage}
          total={visible.length}
          pageSize={PAGE_SIZE}
          label="estudiantes"
        />
      )}

      <StudentProgressDialog
        student={selected}
        topics={topics}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </section>
  )
}
