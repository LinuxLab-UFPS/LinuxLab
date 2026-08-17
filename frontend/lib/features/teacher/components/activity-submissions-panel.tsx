"use client"

import { useState } from "react"
import { BarChart3, ChevronDown, Eye } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { formatBogotaDateTime } from "@/lib/utils/dates"
import type { ActivitySubmissionStudent } from "@/lib/models/activities"

interface ActivitySubmissionsPanelProps {
  submissions: ActivitySubmissionStudent[]
  maxScore: number
}

export function ActivitySubmissionsPanel({ submissions, maxScore }: ActivitySubmissionsPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6 rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/30"
      >
        <span className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Entregas ({submissions.length})
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                    Estudiante
                  </th>
                  <th className="w-20 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                    Intentos
                  </th>
                  <th className="w-44 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                    Fecha de entrega
                  </th>
                  <th className="w-28 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                    Calificacion
                  </th>
                  <th className="w-16 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Aun no hay entregas registradas.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.studentId} className="border-t border-border/60">
                      <td className="px-4 py-2.5">
                        <span className="block text-sm font-medium text-foreground">
                          {sub.studentName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {sub.studentEmail}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-sm text-foreground">
                        {sub.attemptsCount}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">
                        {sub.lastAttemptDate ? formatBogotaDateTime(sub.lastAttemptDate) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-sm text-foreground">
                        {sub.finalScore}/{maxScore}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Eye className="h-4 w-4 mx-auto text-muted-foreground" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
