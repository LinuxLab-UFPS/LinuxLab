"use client"

import { Activity } from "lucide-react"
import { useGroupAuditLog } from "@/lib/api/queries"

/** Últimos eventos de la bitácora de un curso (feed compacto del resumen). */
export function GroupActivityFeed({ groupId, limit = 6 }: { groupId: string; limit?: number }) {
  const { data, isLoading } = useGroupAuditLog(groupId, limit)

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-sky-500" />
        <h3 className="text-sm font-semibold text-foreground">Actividad reciente</h3>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando…</p>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="text-xs text-muted-foreground">Aún no hay actividad registrada en este curso.</p>
      ) : (
        <ul className="space-y-2.5">
          {data!.map((entry) => {
            const date = new Date(entry.timestamp)
            return (
              <li key={entry.id} className="flex items-start gap-2.5">
                <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug text-foreground">{entry.message}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {date.toLocaleDateString("es-CO")} · {date.toLocaleTimeString("es-CO")}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
