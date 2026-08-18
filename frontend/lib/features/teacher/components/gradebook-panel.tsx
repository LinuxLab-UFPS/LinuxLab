"use client"

import { useState } from "react"
import { BarChart3, Users } from "lucide-react"
import { TablePagination } from "@shared/components/data-table"
import { Empty } from "@shared/components/empty"
import { useGradebook } from "@/lib/api/queries"
import { GradebookTable } from "@/lib/features/teacher/components/gradebook-table"
import { StudentPerformanceDrawer } from "@/lib/features/teacher/components/student-performance-drawer"

const PER_PAGE = 15

const PANEL = "rounded-xl border border-table-line bg-background shadow-md dark:shadow-none"

export function GradebookPanel({ groupId, query }: { groupId: string; query: string }) {
  const { data: gradebook, isLoading, error } = useGradebook(groupId)

  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const students = (gradebook?.students ?? []).filter((student) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      student.name.toLowerCase().includes(q) ||
      (student.code ?? "").toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(students.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageStudents = students.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const openStudent = (id: string, name: string) => {
    setSelected({ id, name })
    setDrawerOpen(true)
  }

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Cargando calificaciones…
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No se pudieron cargar las calificaciones.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {gradebook && (
        <>
          {gradebook.activities.length === 0 ? (
            <div className={PANEL}>
              <Empty
                icon={BarChart3}
                title="Sin actividades publicadas"
                description="Este curso todavía no tiene actividades para calificar."
              />
            </div>
          ) : gradebook.students.length === 0 ? (
            <div className={PANEL}>
              <Empty
                icon={Users}
                title="Sin estudiantes inscritos"
                description="Aún no hay estudiantes en este curso."
              />
            </div>
          ) : (
            <>
              <GradebookTable
                gradebook={gradebook}
                groupId={groupId}
                students={pageStudents}
                onStudentClick={openStudent}
              />

              {students.length > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Mostrando {pageStudents.length} de {students.length} estudiantes
                  </span>
                  {totalPages > 1 && (
                    <TablePagination
                      page={safePage}
                      totalPages={totalPages}
                      onChange={setPage}
                      tone="primary"
                    />
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      <StudentPerformanceDrawer
        groupId={groupId}
        studentId={selected?.id ?? null}
        studentName={selected?.name ?? ""}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}