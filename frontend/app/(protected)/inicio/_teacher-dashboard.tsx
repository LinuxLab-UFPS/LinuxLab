"use client"

import { useEffect } from "react"
import { GroupsTable } from "@/lib/features/teacher/components/groups-table"
import { useAuth } from "@/lib/features/auth/context"
import { useGroups } from "@/lib/api/queries"
import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"
import { notify } from "@shared/lib/toast"

export function TeacherDashboard() {
  const { user } = useAuth()
  const groupsQuery = useGroups()
  const loading = groupsQuery.isLoading

  useEffect(() => {
    if (groupsQuery.error) {
      notify.error(groupsQuery.error, "Error al cargar los cursos")
    }
  }, [groupsQuery.error])

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
          Gestiona tus grupos, revisa el progreso de tus estudiantes y sus actividades.
        </p>
      </div>

      {loading ? (
        <SkeletonScreen className="rounded-xl border border-table-line p-5">
          <div className="space-y-4">
            <div className="flex gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-40" />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </SkeletonScreen>
      ) : (
        <GroupsTable />
      )}
    </div>
  )
}
