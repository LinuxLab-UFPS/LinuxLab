"use client"

import { AuditPanel } from "@/lib/features/teacher/components/audit-panel"
import { RoleGuard } from "@shared/components/role-guard"
import { TituloDeSeccion } from "@shared/components/titulo-de-seccion"

export default function AuditLogPage() {
  return (
    <RoleGuard roles={["admin"]}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <TituloDeSeccion>Bitácora</TituloDeSeccion>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Registro histórico de accesos, sesiones y acciones relevantes de la plataforma.
          </p>
        </div>

        <AuditPanel />
      </div>
    </RoleGuard>
  )
}
