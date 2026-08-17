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
import { formatBogotaDateTime } from "@/lib/utils/dates"
import type { EnrollmentStudent } from "@/lib/features/auth/types"

/**
 * Los estudiantes del curso: nombre, email, usuario Linux, ultima conexion
 * y acciones (por definir).
 */
export function GroupStudents({
  students,
  query,
}: {
  students: EnrollmentStudent[]
  query: string
}) {
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
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-40">Usuario</TableHead>
                <TableHead className="w-44">Ultima conexion</TableHead>
                <TableHead className="w-28">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="text-sm font-medium text-foreground">
                    {student.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.email}
                  </TableCell>
                  <TableCell>
                    {student.linuxUsername ? (
                      <span className="font-mono text-sm text-sky-500">
                        {student.linuxUsername}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin cuenta</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.lastLogin
                      ? formatBogotaDateTime(student.lastLogin)
                      : "Sin conexion"}
                  </TableCell>
                  <TableCell />
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
    </section>
  )
}
