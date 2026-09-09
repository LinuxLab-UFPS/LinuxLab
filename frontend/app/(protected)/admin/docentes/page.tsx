"use client"

import { TeachersTable } from "@/lib/features/admin/components/teachers-table"
import { RoleGuard } from "@shared/components/role-guard"
import { useAuth } from "@/lib/features/auth/context"
import { TituloDeSeccion } from "@shared/components/titulo-de-seccion"

export default function DocentesPage() {
  const { user } = useAuth()

  return (
    <RoleGuard roles={["admin"]}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <TituloDeSeccion prefijo="Bienvenido, ">{user?.name ?? "Admin"}</TituloDeSeccion>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Administra los docentes registrados en la plataforma.
          </p>
        </div>

        <TeachersTable />
      </div>
    </RoleGuard>
  )
}
