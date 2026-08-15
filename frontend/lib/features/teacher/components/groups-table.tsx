"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, FolderOpen, Plus, Search } from "lucide-react"
import { Input } from "@shared/components/ui/input"
import { ActionButton } from "@shared/components/action-button"
import { StatTabs } from "@shared/components/stat-tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import {
  TablePanel,
  TableEmptyState,
  TablePagination,
} from "@shared/components/data-table"
import {
  ConfirmCourseDialog,
  type CourseAction,
} from "@/lib/features/teacher/components/confirm-course-dialog"
import type { Group } from "@/lib/features/teacher/types"
import { deactivateGroup, deleteGroup } from "@/lib/features/teacher/data"
import { notifyPromise } from "@shared/lib/toast"

type Tab = "activos" | "desactivados"

const PAGE_SIZE = 8

export function GroupsTable({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [tab, setTab] = useState<Tab>("activos")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  /** Curso y acción destructiva esperando confirmación. */
  const [confirming, setConfirming] = useState<{ group: Group; action: CourseAction } | null>(
    null,
  )
  const [busy, setBusy] = useState(false)

  const counts = useMemo(
    () => ({
      activos: groups.filter((g) => !g.archived).length,
      desactivados: groups.filter((g) => g.archived).length,
    }),
    [groups],
  )

  const q = query.trim().toLowerCase()
  const visible = groups
    .filter((g) => (tab === "activos" ? !g.archived : g.archived))
    .filter((g) => !q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = visible.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  const runConfirmed = async () => {
    if (!confirming) return
    const { group, action } = confirming
    setBusy(true)
    const done = await notifyPromise(
      action === "deactivate" ? deactivateGroup(group.id) : deleteGroup(group.id),
      {
        loading: action === "deactivate" ? "Desactivando el curso…" : "Eliminando el curso…",
        success: action === "deactivate" ? "Curso desactivado" : "Curso eliminado",
        error:
          action === "deactivate"
            ? "No se pudo desactivar el curso."
            : "No se pudo eliminar el curso.",
      },
    )
    if (done.ok) {
      if (action === "deactivate") {
        setGroups((prev) =>
          prev.map((g) => (g.id === group.id ? { ...g, archived: true } : g)),
        )
      } else {
        setGroups((prev) => prev.filter((g) => g.id !== group.id))
      }
    }
    setConfirming(null)
    setBusy(false)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatTabs
          value={tab}
          onChange={(v) => {
            setTab(v as Tab)
            setPage(1)
          }}
          tabs={[
            {
              value: "activos",
              label: "Activos",
              statLabel: "Cursos activos",
              count: counts.activos,
              icon: BookOpen,
              tone: "primary",
            },
            {
              value: "desactivados",
              label: "Inactivos",
              statLabel: "Cursos inactivos",
              count: counts.desactivados,
              icon: BookOpen,
              tone: "neutral",
            },
          ]}
        />

        <div className="relative w-full max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar curso por nombre..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            className="border-table-line pl-9"
          />
        </div>

        <ActionButton tone="primary" href="/create-group" className="ml-auto">
          <Plus className="h-4 w-4" />
          Crear nuevo curso
        </ActionButton>
      </div>

      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Grupo</TableHead>
              <TableHead className="w-56">Directorio de trabajo</TableHead>
              <TableHead className="w-28">Estudiantes</TableHead>
              <TableHead className="w-28">Actividades</TableHead>
              <TableHead className="w-32">Creado</TableHead>
              <TableHead className="w-40">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <Link href={`/groups/${group.id}`} className="group block whitespace-normal">
                    <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {group.name}
                    </span>
                    {group.description && (
                      <span className="block text-xs text-muted-foreground">
                        {group.description}
                      </span>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  {group.groupDir && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                      grupos/{group.groupDir}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground">
                  {group.studentCount}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {group.activityCount}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {new Date(group.createdAt).toLocaleDateString("es-CO")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <ActionButton tone="sky" href={`/groups/${group.id}`}>
                      Ver
                    </ActionButton>
                    {/* Un curso desactivado ya solo se consulta. */}
                    {!group.archived && (
                      <ActionButton
                        tone="amber"
                        onClick={() => setConfirming({ group, action: "deactivate" })}
                      >
                        Desactivar
                      </ActionButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {visible.length === 0 && (
          <TableEmptyState>
            No tienes cursos {tab === "activos" ? "activos" : "desactivados"}.
          </TableEmptyState>
        )}
      </TablePanel>

      {visible.length > 0 && (
        <TablePagination page={page_} totalPages={totalPages} onChange={setPage} />
      )}

      <ConfirmCourseDialog
        group={confirming?.group ?? null}
        action={confirming?.action ?? "deactivate"}
        busy={busy}
        onConfirm={runConfirmed}
        onCancel={() => !busy && setConfirming(null)}
      />
    </div>
  )
}
