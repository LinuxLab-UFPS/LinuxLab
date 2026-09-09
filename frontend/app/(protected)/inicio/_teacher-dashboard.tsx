"use client"

import { useEffect } from "react"
import { GroupsTable } from "@/lib/features/teacher/components/groups-table"
import { useAuth } from "@/lib/features/auth/context"
import { useGroups } from "@/lib/api/queries"
import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"
import { notify } from "@shared/lib/toast"
import { TituloDeSeccion } from "@shared/components/titulo-de-seccion"

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
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <TituloDeSeccion prefijo="Bienvenido, ">{user?.name ?? "Docente"}</TituloDeSeccion>
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
