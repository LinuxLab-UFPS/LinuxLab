"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { formatBogotaDate } from "@/lib/utils/dates"
import { useTeacherRequests } from "@/lib/features/admin/hooks"
import type { TeacherRequest } from "@/lib/features/admin/types"
import { ConfirmDialog } from "./confirm-dialog"
import { IconAction } from "@shared/components/icon-action"
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePanel } from "@shared/components/data-table"

/**
 * Solicitudes de cuenta docente pendientes, encima de la tabla de docentes.
 * Sin pendientes no ocupa espacio: el panel de docentes se ve como siempre.
 */
export function TeacherRequestsPanel() {
  const { requests, busy, approve, reject } = useTeacherRequests()
  const [rejectTarget, setRejectTarget] = useState<TeacherRequest | null>(null)

  if (requests.length === 0) return null

  return (
    <section className="mb-10">
      <h2 className="mb-1 text-lg font-semibold text-foreground">
        Solicitudes pendientes ({requests.length})
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Al aprobar, el docente queda registrado y recibe el correo para configurar su cuenta.
      </p>

      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Docente</TableHead>
              <TableHead className="w-28">Código</TableHead>
              <TableHead className="w-48">Dependencia</TableHead>
              <TableHead className="w-32">Fecha</TableHead>
              <TableHead className="w-28">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <span className="block text-sm font-medium text-foreground">{request.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{request.email}</span>
                  {request.message && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="mt-0.5 block cursor-default truncate text-xs italic text-muted-foreground">
                          “{request.message}”
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">{request.message}</TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-muted-foreground">{request.code}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {request.department ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatBogotaDate(request.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <IconAction
                      label="Aprobar"
                      icon={Check}
                      variant="boxed"
                      disabled={busy}
                      onClick={() => approve(request.id)}
                    />
                    <IconAction
                      label="Rechazar"
                      icon={X}
                      variant="boxed"
                      tone="danger"
                      disabled={busy}
                      onClick={() => setRejectTarget(request)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TablePanel>

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null)
        }}
        title="Rechazar solicitud"
        description={
          rejectTarget
            ? `La solicitud de ${rejectTarget.name} (${rejectTarget.email}) se descartará. Podrá enviar una nueva si lo necesita.`
            : ""
        }
        confirmLabel="Rechazar"
        confirmVariant="destructive"
        onConfirm={() => {
          if (rejectTarget) reject(rejectTarget.id)
          setRejectTarget(null)
        }}
      />
    </section>
  )
}
