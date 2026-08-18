"use client"

import { useRouter } from "next/navigation"
import { formatBogotaDateTime } from "@/lib/utils/dates"
import type { ManualSubmission } from "@/lib/models/activities"

interface SubmissionsTableProps {
  submissions: ManualSubmission[]
  maxScore: number
  groupId: string
  activityId: string
}

export function SubmissionsTable({ submissions, maxScore, groupId, activityId }: SubmissionsTableProps) {
  const router = useRouter()

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-card border-b border-border">
              <th className="w-28 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Codigo
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Estudiante
              </th>
              <th className="w-24 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                Estado
              </th>
              <th className="w-44 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Fecha de entrega
              </th>
              <th className="w-32 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                Calificacion
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
                <tr
                  key={sub.submissionId}
                  className="relative cursor-pointer border-b border-border/50 bg-background transition-colors hover:bg-secondary/30 last:border-0"
                  onClick={() => router.push(`/groups/${groupId}/activities/${activityId}/students/${sub.studentId}`)}
                >
                  <td className="px-4 py-2.5 font-mono text-sm text-muted-foreground">
                    {sub.studentCode ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-medium text-foreground">
                    {sub.studentName}
                  </td>
                  <td className="px-4 py-2.5 text-center text-sm">
                    <span
                      className={
                        sub.status === "graded"
                          ? "text-success"
                          : sub.status === "submitted"
                            ? "text-amber-500"
                            : "text-muted-foreground"
                      }
                    >
                      {sub.status === "graded"
                        ? "Calificada"
                        : sub.status === "submitted"
                          ? "Pendiente"
                          : sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">
                    {formatBogotaDateTime(sub.submittedAt)}
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono text-sm text-foreground">
                    {sub.score != null ? `${sub.score}/${maxScore}` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
