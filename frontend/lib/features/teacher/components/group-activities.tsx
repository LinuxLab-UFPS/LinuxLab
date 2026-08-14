"use client"

import { useState } from "react"
import Link from "next/link"
import { FileCode } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePanel, TableEmptyState, TablePagination } from "@shared/components/data-table"
import { getTopic } from "@shared/lib/content/temario"
import type { Activity } from "@/lib/features/teacher/types"

const PAGE_SIZE = 8

/** Las actividades del curso: una actividad de grupo no lleva dificultad. */
export function GroupActivities({
  activities,
  query,
  groupId,
}: {
  activities: Activity[]
  query: string
  groupId: string
}) {
  const [page, setPage] = useState(1)

  const q = query.trim().toLowerCase()
  const filtered = activities.filter((a) => !q || a.title.toLowerCase().includes(q))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  return (
    <section>
      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Actividad</TableHead>
              <TableHead className="w-48">Tema</TableHead>
              <TableHead className="w-44">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <Link
                    href={`/groups/${groupId}/activities/${activity.id}`}
                    className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-amber-500"
                  >
                    <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {activity.title}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getTopic(activity.topicNumber)?.title ??
                    (activity.topicNumber ? `Tema ${activity.topicNumber}` : "—")}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {activity.evaluationType === "atomic" ? "Autoevaluación" : "Revisión manual"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <TableEmptyState>
            {activities.length === 0
              ? "Este curso todavía no tiene actividades habilitadas."
              : "Ninguna actividad coincide con la búsqueda."}
          </TableEmptyState>
        )}
      </TablePanel>

      {filtered.length > 0 && (
        <TablePagination page={page_} totalPages={totalPages} onChange={setPage} tone="amber" />
      )}
    </section>
  )
}
