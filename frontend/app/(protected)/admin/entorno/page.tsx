"use client"

import { EnvironmentPanel } from "@/lib/features/admin/components/environment-panel"
import { RoleGuard } from "@shared/components/role-guard"
import { TituloDeSeccion } from "@shared/components/titulo-de-seccion"

export default function EntornoPage() {
  return (
    <RoleGuard roles={["admin"]}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <TituloDeSeccion>Entorno</TituloDeSeccion>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Estado del contenedor de prácticas frente a lo que registra la plataforma.
          </p>
        </div>

        <EnvironmentPanel />
      </div>
    </RoleGuard>
  )
}
