"use client"

import Link from "next/link"
import { Inbox } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { scoreColor } from "@shared/lib/score-color"
import { Empty } from "@shared/components/empty"
import { formatBogotaDateTime } from "@/lib/utils/dates"

export interface SubmissionRow {
  studentId: string
  studentName: string
  studentCode: string | null
  middleLabel: string
  middleTone: "success" | "warning" | "muted"
  submittedAt: string | null
  scoreLabel: string
  scoreValue: number | null
  href: string
}

interface SubmissionsTableProps {
  variant: "manual" | "automatic"
  rows: SubmissionRow[]
  emptyMessage?: string
}

export function SubmissionsTable({
  variant,
  rows,
  emptyMessage = "Aun no hay entregas registradas.",
}: SubmissionsTableProps) {
  const centerHeader = variant === "manual" ? "Estado" : "Intentos"

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border">
        <Empty icon={Inbox} title="Sin entregas" description={emptyMessage} />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-card border-b border-border">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Estudiante
              </th>
              <th className="w-24 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                {centerHeader}
              </th>
              <th className="w-44 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Fecha de entrega
              </th>
              <th className="w-24 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                Calificacion
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Link key={row.studentId} href={row.href} className="contents">
                <tr className="cursor-pointer border-b border-border/50 bg-background transition-colors hover:bg-secondary/30 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="block text-sm font-medium text-foreground">
                      {row.studentName}
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {row.studentCode ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-sm">
                    <span
                      className={cn(
                        row.middleTone === "success" && "text-success",
                        row.middleTone === "warning" && "text-amber-500",
                        row.middleTone === "muted" && "font-mono text-muted-foreground",
                      )}
                    >
                      {row.middleLabel}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">
                    {row.submittedAt ? formatBogotaDateTime(row.submittedAt) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono text-sm">
                    <span className={cn(row.scoreValue != null && scoreColor(row.scoreValue))}>
                      {row.scoreLabel}
                    </span>
                  </td>
                </tr>
              </Link>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}