"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
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
import type { Group } from "@/lib/features/teacher/types"
import { setGroupArchived } from "@/lib/features/teacher/data"

type Tab = "activos" | "archivados"

const PAGE_SIZE = 8

export function GroupsTable({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [tab, setTab] = useState<Tab>("activos")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(
    () => ({
      activos: groups.filter((g) => !g.archived).length,
      archivados: groups.filter((g) => g.archived).length,
    }),
    [groups],
  )

  const visible = groups.filter((g) => (tab === "activos" ? !g.archived : g.archived))
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = visible.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  const toggleArchive = async (group: Group) => {
    setError(null)
    try {
      await setGroupArchived(group.id, !group.archived)
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, archived: !g.archived } : g)),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo archivar el curso.")
    }
  }

  return (
    <div>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as Tab)
          setPage(1)
        }}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="activos">
            Activos <span className="ml-1.5 text-xs text-muted-foreground">{counts.activos}</span>
          </TabsTrigger>
          <TabsTrigger value="archivados">
            Archivados{" "}
            <span className="ml-1.5 text-xs text-muted-foreground">{counts.archivados}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <div className="mb-4 rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="border-black/15 hover:bg-transparent dark:border-border">
              <TableHead className="w-16 uppercase tracking-wide text-muted-foreground">
                ID
              </TableHead>
              <TableHead className="uppercase tracking-wide text-muted-foreground">
                Curso
              </TableHead>
              <TableHead className="w-28 text-center uppercase tracking-wide text-muted-foreground">
                Estudiantes
              </TableHead>
              <TableHead className="w-28 text-center uppercase tracking-wide text-muted-foreground">
                Actividades
              </TableHead>
              <TableHead className="w-32 uppercase tracking-wide text-muted-foreground">
                Creado
              </TableHead>
              <TableHead className="w-32 text-right uppercase tracking-wide text-muted-foreground">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((group) => (
              <TableRow
                key={group.id}
                className="border-black/15 hover:bg-secondary/40 dark:border-border"
              >
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
                <TableCell className="text-center font-mono text-sm text-foreground">
                  {group.studentCount}
                </TableCell>
                <TableCell className="text-center font-mono text-sm text-muted-foreground">
                  {group.activityCount}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {new Date(group.createdAt).toLocaleDateString("es-CO")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    <TableActionButton tone="neutral" href={`/groups/${group.id}`}>
                      Ver
                    </TableActionButton>
                    <TableActionButton
                      tone={group.archived ? "emerald" : "amber"}
                      onClick={() => toggleArchive(group)}
                    >
                      {group.archived ? "Restaurar" : "Archivar"}
                    </TableActionButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {visible.length === 0 && (
          <TableEmptyState>
            No tienes cursos {tab === "activos" ? "activos" : "archivados"}.
          </TableEmptyState>
        )}
      </TablePanel>

      {visible.length > 0 && (
        <TablePagination page={page_} totalPages={totalPages} onChange={setPage} />
      )}
    </div>
  )
}
