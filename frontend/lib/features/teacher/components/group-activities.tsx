"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { ClipboardList, FolderOpen } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePanel, TableEmptyState, TablePagination } from "@/shared/components/data-table"
import { Empty } from "@shared/components/empty"
import { getTopic } from "@shared/lib/content/temario"
import { Switch } from "@shared/components/ui/switch"
import { setActivityEnabled } from "@/lib/features/teacher/data"
import { queryKeys } from "@/lib/api/queries"
import { notify } from "@shared/lib/toast"
import { formatBogotaDateTime } from "@/lib/utils/dates"
import type { Activity } from "@/lib/features/teacher/types"

const PAGE_SIZE = 10

/** Las actividades del curso: fila cliqueable con switch de habilitado. */
export function GroupActivities({
  activities,
  query,
  groupId,
  sourceFilter = "all",
}: {
  activities: Activity[]
  query: string
  groupId: string
  /** Que mostrar: todo, solo las del curso, o solo las que armo el docente. */
  sourceFilter?: "all" | "bank" | "teacher"
}) {
  const [page, setPage] = useState(1)
  const [toggling, setToggling] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const q = query.trim().toLowerCase()
  // Filtrar por quiz o taller solo puede devolver actividades del docente: las
  // del curso no se clasifican asi, y colarlas en el resultado seria decir que
  // son talleres cuando nadie lo decidio.
  const filtered = activities.filter(
    (a) =>
      (!q || a.title.toLowerCase().includes(q)) &&
      (sourceFilter === "all" || a.source === sourceFilter),
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  const toggle = async (activity: Activity, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setToggling(activity.id)
    try {
      await setActivityEnabled(groupId, activity.id, !activity.enabled)
      queryClient.invalidateQueries({ queryKey: queryKeys.groupActivities(groupId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.gradebook(groupId) })
      notify.success(activity.enabled ? "Actividad deshabilitada" : "Actividad habilitada")
    } catch (err) {
      notify.error(err, "No se pudo cambiar el estado de la actividad")
    } finally {
      setToggling(null)
    }
  }

  if (activities.length === 0) {
    return (
      <TablePanel>
        <Empty
          icon={ClipboardList}
          title="Sin actividades publicadas"
          description="Este curso todavía no tiene actividades habilitadas."
        />
      </TablePanel>
    )
  }

  return (
    <section>
      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Titulo</TableHead>
              <TableHead className="w-44">Directorio de trabajo</TableHead>
              <TableHead className="w-40">Tema</TableHead>
              <TableHead className="w-40">Evaluación</TableHead>
              <TableHead className="w-44">Fecha de entrega</TableHead>
              <TableHead className="w-24 text-center">Habilitada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {pageRows.map((activity) => (
                <TableRow key={activity.id} className="relative">
                <TableCell>
                  <Link
                    href={`/grupos/${groupId}/actividades/${activity.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={`Ver actividad ${activity.title}`}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {activity.title}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                    <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {activity.workdir ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getTopic(activity.topicNumber)?.title ??
                    (activity.topicNumber ? `Tema ${activity.topicNumber}` : "—")}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {activity.evaluationType === "manual" ? "Manual" : "Automática"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {activity.dueDate
                    ? formatBogotaDateTime(activity.dueDate)
                    : "Sin fecha"}
                </TableCell>
                <TableCell className="text-center">
                  {/* Las del curso van siempre habilitadas: son el temario, y
                      apagarlas en un grupo lo dejaria a medias. Un interruptor
                      que no se puede mover solo confunde, asi que en esas filas
                      la celda queda vacia. */}
                  {activity.source === "bank" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className="relative z-20 inline-flex">
                      <Switch
                        checked={activity.enabled ?? false}
                        onCheckedChange={() => {}}
                        disabled={toggling === activity.id}
                        onClick={(e: React.MouseEvent) => toggle(activity, e)}
                      />
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <TableEmptyState>Ninguna actividad coincide con la búsqueda.</TableEmptyState>
        )}
      </TablePanel>

      {filtered.length > 0 && (
        <TablePagination
          page={page_}
          totalPages={totalPages}
          onChange={setPage}
          tone="primary"
          total={filtered.length}
          pageSize={PAGE_SIZE}
          label="actividades"
        />
      )}
    </section>
  )
}
