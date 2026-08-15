"use client"

import { useEffect, useRef } from "react"
import { Loader2, TriangleAlert } from "lucide-react"
import { useAuth } from "@/lib/features/auth/context"
import { useProvisioningStatus } from "@/lib/api/queries"
import { notify } from "@shared/lib/toast"

/**
 * Indicador persistente de aprovisionamiento: mientras haya cuentas
 * creandose en el entorno, una pill fija abajo a la derecha muestra el
 * progreso en cualquier vista. Al terminar (todo listo o fallido) se resuelve
 * con un toast y desaparece.
 */
export function ProvisioningIndicator() {
  const { user } = useAuth()
  const isTeacher = user?.role === "teacher"
  const statusQuery = useProvisioningStatus(isTeacher)
  const status = statusQuery.data
  const wasActive = useRef(false)

  const pending = status?.pending ?? 0
  const active = pending > 0
  const done = status ? status.completed + status.failed : 0
  const total = status?.total ?? 0

  useEffect(() => {
    if (!isTeacher) {
      wasActive.current = false
      return
    }
    if (active) {
      wasActive.current = true
      return
    }
    // Transicion activo -> quieto: el entorno termino, se avisa una sola vez.
    if (wasActive.current) {
      wasActive.current = false
      if (status && status.failed > 0) {
        notify.error(null, `${status.failed} cuenta(s) fallaron en el entorno`)
      } else if (status) {
        notify.success(
          `${status.completed} ${status.completed === 1 ? "estudiante" : "estudiantes"} listos en el entorno`,
        )
      }
    }
  }, [active, status, isTeacher])

  if (!isTeacher || !active || !status) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-full border border-table-line bg-card px-4 py-2 shadow-lg">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm text-foreground">
        Creando cuentas en el entorno…{" "}
        <span className="font-mono text-primary">
          {done}/{total}
        </span>
      </span>
      {status.failed > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-warning">
          <TriangleAlert className="h-3.5 w-3.5" />
          {status.failed} fallida(s)
        </span>
      )}
    </div>
  )
}
