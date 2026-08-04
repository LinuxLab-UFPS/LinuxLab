"use client"

import { useState, useEffect, useMemo } from "react"
import { Loader2, Search, Terminal, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TeacherListItem } from "@/lib/features/admin/types"
import type { TeacherFilters } from "@/lib/features/admin/api"
import { useTeachers } from "@/lib/features/admin/hooks"
import { RegisterTeacherDialog } from "./register-teacher-dialog"
import { ConfirmDialog } from "./confirm-dialog"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/shared/status-badge"
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
import {
  TablePanel,
  TableEmptyState,
  TableActionButton,
  TablePagination,
} from "@/components/shared/data-table"
import { StatTabs } from "@/components/shared/stat-tabs"

type StatusFilter = "all" | "active" | "inactive"

const PAGE_SIZE = 8

/** El item resaltado del dropdown sigue el morado del admin. Va explícito
 *  porque Radix monta el menú en un portal, fuera de `data-section`. */
const SELECT_ITEM = "focus:bg-violet-500/10 focus:text-violet-400"

export function TeachersTable() {
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [confirmTarget, setConfirmTarget] = useState<TeacherListItem | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const filters = useMemo<TeacherFilters>(
    () => ({
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(statusFilter !== "all" && { status: statusFilter }),
    }),
    [debouncedSearch, statusFilter],
  )

  const { teachers, loading, submitting, register, toggleStatus, provisioningJobs } = useTeachers(filters)

  const jobByEmail = useMemo(() => {
    const map = new Map<string, (typeof provisioningJobs)[number]>()
    for (const job of provisioningJobs) {
      const key = job.teacher.email.toLowerCase()
      if (!map.has(key)) map.set(key, job)
    }
    return map
  }, [provisioningJobs])

  const totalPages = Math.max(1, Math.ceil(teachers.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = teachers.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  const handleToggle = (teacher: TeacherListItem) => {
    if (teacher.active) {
      setConfirmTarget(teacher)
    } else {
      toggleStatus(teacher.id)
    }
  }

  const handleConfirmDeactivate = () => {
    if (confirmTarget) {
      toggleStatus(confirmTarget.id)
      setConfirmTarget(null)
    }
  }

  return (
    <>
      {/* Una sola vista, así que la pestaña se queda siempre abierta con su cifra. */}
      <StatTabs
        className="mb-4"
        value="docentes"
        tabs={[
          {
            value: "docentes",
            label: "Docentes",
            statLabel: "Docentes totales",
            count: teachers.length,
            icon: Users,
            tone: "violet",
          },
        ]}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
              placeholder="Buscar docente por nombre o correo..."
              className="border-table-line pl-9 pr-8"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full border-table-line sm:w-40">
              <SelectValue placeholder="Filtrar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className={SELECT_ITEM}>
                Todos
              </SelectItem>
              <SelectItem value="active" className={SELECT_ITEM}>
                Activos
              </SelectItem>
              <SelectItem value="inactive" className={SELECT_ITEM}>
                Inactivos
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <RegisterTeacherDialog onRegister={register} submitting={submitting} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-table-line py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <TablePanel>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Docente</TableHead>
                  <TableHead className="w-48">Cuenta Linux</TableHead>
                  <TableHead className="w-36">Estado cuenta</TableHead>
                  <TableHead className="w-36">Creado</TableHead>
                  <TableHead className="w-32">Estado</TableHead>
                  <TableHead className="w-36">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((teacher) => {
                  const job = jobByEmail.get(teacher.email.toLowerCase())
                  return (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <span className="block text-sm font-medium text-foreground">
                          {teacher.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {teacher.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        {teacher.linuxUsername ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-sm text-sky-500">
                            <Terminal className="h-3.5 w-3.5 shrink-0" />
                            {teacher.linuxUsername}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin cuenta</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {job ? (
                          <StatusBadge status={job.status} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {teacher.createdAt
                          ? new Date(teacher.createdAt).toLocaleDateString("es-CO")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            teacher.active
                              ? "border-success/30 bg-success/10 text-success"
                              : "border-table-line bg-secondary text-muted-foreground",
                          )}
                        >
                          {teacher.active ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <TableActionButton
                          tone={teacher.active ? "amber" : "emerald"}
                          onClick={() => handleToggle(teacher)}
                        >
                          {teacher.active ? "Desactivar" : "Activar"}
                        </TableActionButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {teachers.length === 0 && (
              <TableEmptyState>
                {debouncedSearch || statusFilter !== "all"
                  ? "Ningún docente coincide con los filtros actuales."
                  : "Todavía no hay docentes registrados."}
              </TableEmptyState>
            )}
          </TablePanel>

          {teachers.length > 0 && (
            <TablePagination page={page_} totalPages={totalPages} onChange={setPage} tone="violet" />
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null)
        }}
        title="Dar de baja docente"
        description={
          confirmTarget
            ? `¿Estás seguro de dar de baja a "${confirmTarget.name}"? El docente no podrá autenticarse hasta que sea reactivado. Su información histórica se conservará intacta.`
            : ""
        }
        confirmLabel="Dar de baja"
        confirmVariant="destructive"
        onConfirm={handleConfirmDeactivate}
      />
    </>
  )
}
