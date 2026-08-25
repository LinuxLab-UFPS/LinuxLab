"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Archive, BookOpen, FolderOpen, Plus, Search } from "lucide-react"
import { Input } from "@shared/components/ui/input"
import { ActionButton } from "@shared/components/action-button"
import { IconAction } from "@shared/components/icon-action"
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
import { queryKeys, useGroups } from "@/lib/api/queries"
import { notifyPromise } from "@shared/lib/toast"

type Tab = "activos" | "desactivados"

const PAGE_SIZE = 10

export function GroupsTable() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const groupsQuery = useGroups()
  // Sin estado local: la tabla lee siempre la query, y las mutaciones
  // actualizan la cache con setQueryData + invalidacion. Asi cualquier
  // invalidacion externa (p. ej. al crear un grupo) se refleja al instante.
  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data])
  const [tab, setTab] = useState<Tab>("activos")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  /** Grupo y acción destructiva esperando confirmación. */
  const [confirming, setConfirming] = useState<{ group: Group; action: CourseAction } | null>(
    null,
  )
  const [busy, setBusy] = useState(false)

  const counts = useMemo(
    () => ({
      activos: groups.filter((g) => g.status === "active").length,
      desactivados: groups.filter((g) => g.status === "archived").length,
    }),
    [groups],
  )

  const q = query.trim().toLowerCase()
  const visible = groups
    .filter((g) => (tab === "activos" ? g.status === "active" : g.status === "archived"))
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
        loading: action === "deactivate" ? "Desactivando el grupo…" : "Eliminando el grupo…",
        success: action === "deactivate" ? "Grupo desactivado" : "Grupo eliminado",
        error:
          action === "deactivate"
            ? "No se pudo desactivar el grupo."
            : "No se pudo eliminar el grupo.",
      },
    )
    if (done.ok) {
      if (action === "deactivate") {
        queryClient.setQueryData(queryKeys.groups, (prev: Group[] = []) =>
          prev.map((g) => (g.id === group.id ? { ...g, status: "archived" } : g)),
        )
        queryClient.invalidateQueries({ queryKey: queryKeys.group(group.id) })
      } else {
        queryClient.setQueryData(queryKeys.groups, (prev: Group[] = []) =>
          prev.filter((g) => g.id !== group.id),
        )
      }
      // El listado de /home comparte cache con esta tabla local.
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
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
              statLabel: "Grupos activos",
              count: counts.activos,
              icon: BookOpen,
              tone: "primary",
            },
            {
              value: "desactivados",
              label: "Inactivos",
              statLabel: "Grupos inactivos",
              count: counts.desactivados,
              icon: BookOpen,
              tone: "neutral",
            },
          ]}
        />

        <div className="relative w-full max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar grupo por nombre..."
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
          Crear nuevo grupo
        </ActionButton>
      </div>

      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-44">Grupo</TableHead>
              <TableHead className="w-56">Directorio de trabajo</TableHead>
              <TableHead className="w-28">Estudiantes</TableHead>
              <TableHead className="w-32">Creado</TableHead>
              <TableHead className="w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((group) => (
              // La fila entera lleva al grupo. Un `<Link>` no puede envolver un
              // `<tr>`, asi que navega por `onClick`; el nombre sigue siendo un
              // enlace de verdad para que se pueda alcanzar con el tabulador,
              // que un `onClick` en la fila no da.
              <TableRow
                key={group.id}
                onClick={() => router.push(`/groups/${group.id}`)}
                className="group cursor-pointer"
              >
                <TableCell>
                  <Link
                    href={`/groups/${group.id}`}
                    className="block truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary"
                  >
                    {group.name}
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
                  {new Date(group.createdAt).toLocaleDateString("es-CO")}
                </TableCell>
                {/* La accion no debe navegar tambien: el clic muere aqui. El
                    boton de ver desaparecio porque la fila ya hace eso. */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    {/* Un grupo desactivado ya solo se consulta. El icono es un
                        archivador y no una equis: esto archiva, no borra. */}
                    {group.status === "active" && (
                      <IconAction
                        label="Archivar grupo"
                        icon={Archive}
                        onClick={() => setConfirming({ group, action: "deactivate" })}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {visible.length === 0 && (
          <TableEmptyState>
            No tienes grupos {tab === "activos" ? "activos" : "desactivados"}.
          </TableEmptyState>
        )}
      </TablePanel>

      {visible.length > 0 && (
        <TablePagination
          page={page_}
          totalPages={totalPages}
          onChange={setPage}
          total={visible.length}
          pageSize={PAGE_SIZE}
          label="grupos"
        />
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
