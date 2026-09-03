"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  FolderOpen,
  LayoutGrid,
  Pencil,
  Plus,
} from "lucide-react"
import { ActionButton } from "@shared/components/action-button"
import { IconAction } from "@shared/components/icon-action"
import { SearchBar } from "@shared/components/search-bar"
import { StatTabs } from "@shared/components/stat-tabs"
import { GroupStatusBadge } from "@shared/components/group-status-badge"
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
import {
  deactivateGroup,
  deleteGroup,
  unarchiveGroup,
} from "@/lib/features/teacher/data"
import { queryKeys, useGroups } from "@/lib/api/queries"
import { notifyPromise } from "@shared/lib/toast"
import { formatBogotaDate } from "@/lib/utils/dates"

type Tab = "todos" | "archivados"

const PAGE_SIZE = 10

export function GroupsTable() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const groupsQuery = useGroups()
  // Sin estado local: la tabla lee siempre la query, y las mutaciones
  // actualizan la cache con setQueryData + invalidacion. Asi cualquier
  // invalidacion externa (p. ej. al crear un grupo) se refleja al instante.
  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data])
  const [tab, setTab] = useState<Tab>("todos")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  /** Grupo y acción destructiva esperando confirmación. */
  const [confirming, setConfirming] = useState<{ group: Group; action: CourseAction } | null>(
    null,
  )
  const [busy, setBusy] = useState(false)

  const counts = useMemo(
    () => ({
      todos: groups.filter((g) => g.status !== "archived").length,
      archivados: groups.filter((g) => g.status === "archived").length,
    }),
    [groups],
  )

  const q = query.trim().toLowerCase()
  const visible = groups
    .filter((g) => (tab === "todos" ? g.status !== "archived" : g.status === "archived"))
    .filter((g) => !q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = visible.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  const runConfirmed = async () => {
    if (!confirming) return
    const { group, action } = confirming
    setBusy(true)
    const done = await notifyPromise(
      action === "archive" ? deactivateGroup(group.id) : deleteGroup(group.id),
      {
        loading: action === "archive" ? "Archivando el grupo…" : "Eliminando el grupo…",
        success: action === "archive" ? "Grupo archivado" : "Grupo eliminado",
        error:
          action === "archive" ? "No se pudo archivar el grupo." : "No se pudo eliminar el grupo.",
      },
    )
    if (done.ok) {
      if (action === "archive") {
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

  const handleUnarchive = async (group: Group) => {
    const done = await notifyPromise(unarchiveGroup(group.id), {
      loading: "Restaurando el grupo…",
      success: "Grupo restaurado",
      description: "Vuelve al listado principal como finalizado.",
      error: "No se pudo desarchivar el grupo.",
    })
    if (done.ok) {
      queryClient.setQueryData(queryKeys.groups, (prev: Group[] = []) =>
        prev.map((g) => (g.id === group.id ? { ...g, status: "finished" } : g)),
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.group(group.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
    }
  }

  return (
    <div>
      {/* En movil cada cosa en su linea. Antes iban las tres en fila con
          `flex-wrap`: el control segmentado no encoge y el boton es `shrink-0`,
          asi que el buscador se quedaba reducido a "Bu...". */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <StatTabs
          value={tab}
          onChange={(v) => {
            setTab(v as Tab)
            setPage(1)
          }}
          tabs={[
            {
              value: "todos",
              label: "Todos",
              statLabel: "Grupos activos y finalizados",
              count: counts.todos,
              icon: LayoutGrid,
              tone: "primary",
            },
            {
              value: "archivados",
              label: "Archivados",
              statLabel: "Grupos archivados",
              count: counts.archivados,
              icon: Archive,
              tone: "neutral",
            },
          ]}
        />

        <SearchBar
          value={query}
          onChange={(valor) => {
            setQuery(valor)
            setPage(1)
          }}
          placeholder="Buscar grupo por nombre..."
          className="sm:max-w-sm flex-1"
        />

        <ActionButton tone="primary" href="/grupos/crear" className="sm:ml-auto">
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
              <TableHead className="w-32">Estado</TableHead>
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
                onClick={() => router.push(`/grupos/${group.id}`)}
                className="group cursor-pointer"
              >
                <TableCell>
                  <Link
                    href={`/grupos/${group.id}`}
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
                  {formatBogotaDate(group.createdAt)}
                </TableCell>
                <TableCell>
                  <GroupStatusBadge status={group.status} />
                </TableCell>
                {/* La accion no debe navegar tambien: el clic muere aqui. El
                    boton de ver desaparecio porque la fila ya hace eso. Las
                    acciones viven en botones con borde (como la paginacion):
                    rojo para las que cierran o apartan el curso, neutro para
                    editar. */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    {group.status === "active" && (
                      <>
                        <IconAction
                          label="Editar grupo"
                          icon={Pencil}
                          variant="boxed"
                          href={`/grupos/${group.id}/editar`}
                        />
                        <IconAction
                          label="Finalizar curso"
                          icon={CheckCircle2}
                          variant="boxed"
                          tone="danger"
                          onClick={() => router.push(`/grupos/${group.id}/finalizar`)}
                        />
                      </>
                    )}
                    {group.status === "finished" && (
                      <IconAction
                        label="Archivar grupo"
                        icon={Archive}
                        variant="boxed"
                        tone="danger"
                        onClick={() => setConfirming({ group, action: "archive" })}
                      />
                    )}
                    {group.status === "archived" && (
                      <IconAction
                        label="Desarchivar grupo"
                        icon={ArchiveRestore}
                        variant="boxed"
                        tone="danger"
                        onClick={() => handleUnarchive(group)}
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
            {tab === "todos"
              ? "No tienes grupos activos ni finalizados."
              : "No tienes grupos archivados."}
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
        action={confirming?.action ?? "archive"}
        busy={busy}
        onConfirm={runConfirmed}
        onCancel={() => !busy && setConfirming(null)}
      />
    </div>
  )
}
