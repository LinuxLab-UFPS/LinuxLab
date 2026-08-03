"use client"

import { useState } from "react"
import { FileCode, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePanel, TableEmptyState, TablePagination } from "@/components/shared/data-table"
import { ActionButton } from "@/components/shared/action-button"
import { cn } from "@/lib/utils"
import { getTopic } from "@/lib/features/shared/temario"
import type { Activity, Difficulty } from "@/lib/features/teacher/types"

const PAGE_SIZE = 8

const DIFFICULTY: Record<Difficulty, { label: string; className: string }> = {
  basic: { label: "Fácil", className: "bg-success/10 text-success border-success/30" },
  intermediate: {
    label: "Intermedio",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  advanced: { label: "Difícil", className: "bg-danger/10 text-danger border-danger/30" },
}

/** Las actividades habilitadas en el curso. */
export function GroupActivities({
  activities,
  archived,
}: {
  activities: Activity[]
  /** Un curso desactivado es solo histórico: no se le agregan actividades. */
  archived?: boolean
}) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const q = query.trim().toLowerCase()
  const filtered = activities.filter((a) => !q || a.title.toLowerCase().includes(q))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar actividad por nombre..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            className="border-table-line pl-9"
          />
        </div>

        {!archived && (
          <ActionButton tone="amber">
            <Plus className="h-4 w-4" />
            Agregar actividad
          </ActionButton>
        )}
      </div>

      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Actividad</TableHead>
              <TableHead className="w-48">Tema</TableHead>
              <TableHead className="w-36">Dificultad</TableHead>
              <TableHead className="w-44">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((activity) => {
              const difficulty = activity.difficulty ? DIFFICULTY[activity.difficulty] : null
              return (
                <TableRow key={activity.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {activity.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getTopic(activity.topicNumber)?.title ?? `Tema ${activity.topicNumber}`}
                  </TableCell>
                  <TableCell>
                    {difficulty && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          difficulty.className,
                        )}
                      >
                        {difficulty.label}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {activity.evaluationType === "atomic" ? "Autoevaluación" : "Revisión manual"}
                  </TableCell>
                </TableRow>
              )
            })}
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
