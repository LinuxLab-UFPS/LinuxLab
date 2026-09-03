"use client"

import { EnvironmentPanel } from "@/lib/features/admin/components/environment-panel"
import { RoleGuard } from "@shared/components/role-guard"

export default function EntornoPage() {
  return (
    <RoleGuard roles={["admin"]}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Entorno
            </span>
          </h1>
          <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Estado del contenedor de prácticas frente a lo que registra la plataforma.
          </p>
        </div>

        <EnvironmentPanel />
      </div>
    </RoleGuard>
  )
}
