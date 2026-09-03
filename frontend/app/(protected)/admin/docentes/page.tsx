"use client"

import { TeachersTable } from "@/lib/features/admin/components/teachers-table"
import { RoleGuard } from "@shared/components/role-guard"
import { useAuth } from "@/lib/features/auth/context"

export default function DocentesPage() {
  const { user } = useAuth()

  return (
    <RoleGuard roles={["admin"]}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="text-foreground">Bienvenido, </span>
            <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
              {user?.name ?? "Admin"}
            </span>
          </h1>
          <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-[#ff5470] to-[#C41E3A]" />
          <p className="mt-4 max-w-xl text-muted-foreground">
            Administra los docentes registrados en la plataforma.
          </p>
        </div>

        <TeachersTable />
      </div>
    </RoleGuard>
  )
}
