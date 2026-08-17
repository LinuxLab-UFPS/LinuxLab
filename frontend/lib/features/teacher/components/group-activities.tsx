"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { FileCode, Power } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ActionButton } from "@shared/components/action-button"
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
import { setActivityEnabled } from "@/lib/features/teacher/data"
import { queryKeys } from "@/lib/api/queries"
import { notify } from "@shared/lib/toast"
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
  const [toggling, setToggling] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const q = query.trim().toLowerCase()
  const filtered = activities.filter((a) => !q || a.title.toLowerCase().includes(q))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  const toggle = async (activity: Activity) => {
    setToggling(activity.id)
    try {
      await setActivityEnabled(groupId, activity.id, !activity.enabled)
      queryClient.invalidateQueries({ queryKey: queryKeys.groupActivities(groupId) })
      notify.success(activity.enabled ? "Actividad deshabilitada" : "Actividad habilitada")
    } catch (e) {
      notify.error(e, "No se pudo cambiar el estado de la actividad")
    } finally {
      setToggling(null)
    }
  }

  return (
    <section>
      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Actividad</TableHead>
              <TableHead className="w-48">Tema</TableHead>
              <TableHead className="w-44">Tipo</TableHead>
              <TableHead className="w-40">Estado</TableHead>
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
                  {activity.evaluationType === "manual"
                    ? "Revisión manual"
                    : activity.activityType === "quiz"
                      ? "Quiz"
                      : "Taller"}
                </TableCell>
                <TableCell className="text-sm">
                  <span
                    className={cn(
                      "mr-2 text-xs",
                      activity.enabled ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    {activity.enabled ? "Habilitada" : "Deshabilitada"}
                  </span>
                  <span title={activity.enabled ? "Deshabilitar" : "Habilitar"}>
                  <ActionButton
                    tone="neutral"
                    size="sm"
                    onClick={() => toggle(activity)}
                    disabled={toggling === activity.id}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </ActionButton>
                </span>
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
