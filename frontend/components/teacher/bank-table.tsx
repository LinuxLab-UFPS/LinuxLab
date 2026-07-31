"use client"

import { useMemo, useState } from "react"
import { Search, Plus, FileCode } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePanel, TableEmptyState, TablePagination } from "@/components/shared/data-table"
import { cn } from "@/lib/utils"
import type { Activity, Difficulty } from "@/lib/features/teacher/types"
import { syllabus, getTopic } from "@/lib/features/shared/temario"

const DIFFICULTY: Record<Difficulty, { label: string; className: string }> = {
  basic: { label: "Fácil", className: "bg-success/10 text-success border-success/30" },
  intermediate: {
    label: "Intermedio",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  advanced: { label: "Difícil", className: "bg-danger/10 text-danger border-danger/30" },
}

/** El banco es la sección azul: el item resaltado del dropdown la sigue.
 *  Va explícito porque Radix monta el menú en un portal, fuera del
 *  contenedor que define `data-section`. */
const SELECT_ITEM = "focus:bg-sky-500/10 focus:text-sky-500"

const PAGE_SIZE = 8

export function BankTable({ activities }: { activities: Activity[] }) {
  const [query, setQuery] = useState("")
  const [topicFilter, setTopicFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return activities.filter((activity) => {
      const matchesQuery = activity.title.toLowerCase().includes(query.toLowerCase())
      const matchesTopic =
        topicFilter === "all" || activity.topicNumber === Number(topicFilter)
      const matchesDifficulty =
        difficultyFilter === "all" || activity.difficulty === difficultyFilter
      return matchesQuery && matchesTopic && matchesDifficulty
    })
  }, [activities, query, topicFilter, difficultyFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar actividades..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              className="border-table-line pl-9"
            />
          </div>

          <Select
            value={topicFilter}
            onValueChange={(v) => {
              setTopicFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full border-table-line sm:w-56">
              <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className={SELECT_ITEM}>
                Todos los temas
              </SelectItem>
              {syllabus.map((topic) => (
                <SelectItem
                  key={topic.number}
                  value={String(topic.number)}
                  className={SELECT_ITEM}
                >
                  {topic.number}. {topic.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={difficultyFilter}
            onValueChange={(v) => {
              setDifficultyFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full border-table-line sm:w-40">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className={SELECT_ITEM}>
                Todas
              </SelectItem>
              <SelectItem value="basic" className={SELECT_ITEM}>
                Fácil
              </SelectItem>
              <SelectItem value="intermediate" className={SELECT_ITEM}>
                Intermedio
              </SelectItem>
              <SelectItem value="advanced" className={SELECT_ITEM}>
                Difícil
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={() => toast.info("Crear actividad: aún no implementado")}
          className="flex shrink-0 items-center gap-2 rounded-md bg-sky-500 px-3.5 py-2 text-sm font-medium text-white shadow-[0_0_10px_rgba(14,165,233,0.4)] transition-colors hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" />
          Crear actividad
        </button>
      </div>

      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Actividad</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead className="w-32">Dificultad</TableHead>
              <TableHead className="w-44">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium text-foreground">{activity.title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getTopic(activity.topicNumber)?.title ?? "—"}
                </TableCell>
                <TableCell>
                  {activity.difficulty ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        DIFFICULTY[activity.difficulty].className,
                      )}
                    >
                      {DIFFICULTY[activity.difficulty].label}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {activity.evaluationType === "manual" ? "Revisión manual" : "Autoevaluación"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <TableEmptyState>
            {activities.length === 0
              ? "Aún no hay actividades en el banco."
              : "Ninguna actividad coincide con la búsqueda."}
          </TableEmptyState>
        )}
      </TablePanel>

      {filtered.length > 0 && (
        <TablePagination page={page_} totalPages={totalPages} onChange={setPage} />
      )}
    </div>
  )
}
