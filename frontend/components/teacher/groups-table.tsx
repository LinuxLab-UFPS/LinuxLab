"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TablePanel,
  TableEmptyState,
  TableActionButton,
  TablePagination,
} from "@/components/shared/data-table"
import {
  ConfirmCourseDialog,
  type CourseAction,
} from "@/components/teacher/confirm-course-dialog"
import type { Group } from "@/lib/features/teacher/types"
import { deactivateGroup, deleteGroup } from "@/lib/features/teacher/data"

type Tab = "activos" | "desactivados"

const PAGE_SIZE = 8

/** La pestaña activa toma el color de la sección (ver `data-section`). */
const TAB =
  "data-[state=active]:border-section/30 data-[state=active]:bg-section/10 data-[state=active]:text-section dark:data-[state=active]:border-section/30 dark:data-[state=active]:bg-section/10 dark:data-[state=active]:text-section"

export function GroupsTable({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [tab, setTab] = useState<Tab>("activos")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
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

  const visible = groups.filter((g) => (tab === "activos" ? !g.archived : g.archived))
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = visible.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  const runConfirmed = async () => {
    if (!confirming) return
    const { group, action } = confirming
    setError(null)
    setBusy(true)
    try {
      if (action === "deactivate") {
        await deactivateGroup(group.id)
        setGroups((prev) =>
          prev.map((g) => (g.id === group.id ? { ...g, archived: true } : g)),
        )
      } else {
        await deleteGroup(group.id)
        setGroups((prev) => prev.filter((g) => g.id !== group.id))
      }
      setConfirming(null)
    } catch (e) {
      const fallback =
        action === "deactivate"
          ? "No se pudo desactivar el curso."
          : "No se pudo eliminar el curso."
      setError(e instanceof Error ? e.message : fallback)
      setConfirming(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as Tab)
            setPage(1)
          }}
        >
          <TabsList>
            <TabsTrigger value="activos" className={TAB}>
              Activos{" "}
              <span className="ml-1.5 text-xs text-muted-foreground">{counts.activos}</span>
            </TabsTrigger>
            <TabsTrigger value="desactivados" className={TAB}>
              Desactivados{" "}
              <span className="ml-1.5 text-xs text-muted-foreground">
                {counts.desactivados}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Link
          href="/create-group"
          className="neon-glow flex shrink-0 items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Crear nuevo curso
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Curso</TableHead>
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
                  <span className="inline-flex min-w-9 items-center justify-center rounded-md bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    #{group.id}
                  </span>
                </TableCell>
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
                    <TableActionButton tone="neutral" href={`/groups/${group.id}`}>
                      Ver
                    </TableActionButton>
                    {/* Desactivar es de una sola vía (el backend no reactiva),
                        así que un curso desactivado solo se consulta o se
                        elimina. Ambas son destructivas y piden confirmación. */}
                    <TableActionButton
                      tone={group.archived ? "danger" : "amber"}
                      onClick={() =>
                        setConfirming({
                          group,
                          action: group.archived ? "delete" : "deactivate",
                        })
                      }
                    >
                      {group.archived ? "Eliminar" : "Desactivar"}
                    </TableActionButton>
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
