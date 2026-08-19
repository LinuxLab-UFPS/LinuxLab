"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePanel, TableEmptyState, TablePagination } from "@shared/components/data-table"
import { timeAgo } from "@/lib/utils/dates"
import type { EnrollmentStudent } from "@/lib/features/auth/types"

const PAGE_SIZE = 10

/**
 * Los estudiantes del curso: nombre, email, usuario Linux, actividades
 * completadas y ultima conexion.
 */
export function GroupStudents({
  students,
  query,
}: {
  students: EnrollmentStudent[]
  query: string
}) {
  const [page, setPage] = useState(1)
  const q = query.trim().toLowerCase()
  const visible = students.filter(
    (student) =>
      !q ||
      student.name.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q),
  )
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = visible.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  return (
    <section>
      <TablePanel>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-28">Codigo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-40">Usuario</TableHead>
                <TableHead className="w-28 text-center">Entregas</TableHead>
                <TableHead className="w-44">Ultima conexion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <span className="font-mono text-sm text-muted-foreground">
                      {student.code ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-foreground">
                      {student.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.email}
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
                  <TableCell className="text-center font-mono text-sm text-foreground">
                    {student.completedActivities ?? 0}/{student.totalActivities ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.lastLogin ? timeAgo(student.lastLogin) : "Sin conexion"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {visible.length === 0 && (
          <TableEmptyState>
            {students.length === 0
              ? "No hay estudiantes inscritos en este curso."
              : "Ningun estudiante coincide con la busqueda."}
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
    </section>
  )
}
