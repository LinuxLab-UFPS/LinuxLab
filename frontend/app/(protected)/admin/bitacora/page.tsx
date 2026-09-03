"use client"

import { AuditPanel } from "@/lib/features/teacher/components/audit-panel"
import { RoleGuard } from "@shared/components/role-guard"

export default function AuditLogPage() {
  return (
    <RoleGuard roles={["admin"]}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
              Bitácora
            </span>
          </h1>
          <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-sky-400 to-sky-600" />
          <p className="mt-4 max-w-xl text-muted-foreground">
            Registro histórico de accesos, sesiones y acciones relevantes de la plataforma.
          </p>
        </div>

        <AuditPanel />
      </div>
    </RoleGuard>
  )
}
