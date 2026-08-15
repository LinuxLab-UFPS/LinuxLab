"use client"

import { GroupsTable } from "@/lib/features/teacher/components/groups-table"
import { useAuth } from "@/lib/features/auth/context"
import { useGroups } from "@/lib/api/queries"

export function TeacherDashboard() {
  const { user } = useAuth()
  const groupsQuery = useGroups()
  const groups = groupsQuery.data ?? []
  const loading = groupsQuery.isLoading
  const error = groupsQuery.error

  return (
    <div data-section="cursos" className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="text-foreground">Bienvenido, </span>
          <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
            {user?.name ?? "Docente"}
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-[#ff5470] to-[#C41E3A]" />
        <p className="mt-4 max-w-xl text-muted-foreground">
          Gestiona tus cursos, revisa el progreso de tus estudiantes y sus actividades.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error instanceof Error ? error.message : "Error al cargar cursos"}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-table-line py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-section border-t-transparent" />
        </div>
      ) : (
        <GroupsTable initialGroups={groups} />
      )}
    </div>
  )
}
