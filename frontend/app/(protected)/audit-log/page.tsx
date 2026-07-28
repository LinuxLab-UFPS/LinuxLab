import { listAuditLog } from "@/lib/features/teacher/data"
import { AuditTable } from "@/components/teacher/audit-table"

export default async function AuditLogPage() {
  const entries = await listAuditLog()

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Bitácora de Accesos</h1>
        <p className="text-muted-foreground text-sm">
          Registro histórico de accesos y acciones relevantes en la plataforma
        </p>
      </div>

      <AuditTable entries={entries} />
    </div>
  )
}
