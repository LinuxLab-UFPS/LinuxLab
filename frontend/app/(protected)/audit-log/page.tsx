import { listAuditLog } from "@/lib/features/teacher/data"
import { AuditTable } from "@/components/teacher/audit-table"
import { requireServerRole } from "@/lib/features/auth/session"

export default async function AuditLogPage() {
  await requireServerRole(["teacher", "admin"])
  const entries = await listAuditLog()

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
            Bitácora
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-violet-400 to-violet-600" />
        <p className="mt-4 max-w-xl text-muted-foreground">
          Registro histórico de accesos y acciones relevantes en la plataforma.
        </p>
      </div>

      <AuditTable entries={entries} />
    </div>
  )
}
