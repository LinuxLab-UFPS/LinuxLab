"use client"

import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { TeacherListItem } from "@/lib/features/admin/types"
import type { TeacherFilters } from "@/lib/features/admin/api"
import { useTeachers } from "@/lib/features/admin/hooks"
import { RegisterTeacherDialog } from "./register-teacher-dialog"
import { ConfirmDialog } from "./confirm-dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  UserCheck,
  UserX,
  RotateCcw,
  Loader2,
  Search,
  X,
  Terminal,
  CheckCircle2,
  CircleDashed,
} from "lucide-react"

type StatusFilter = "all" | "active" | "inactive"

export function TeachersTable() {
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [confirmTarget, setConfirmTarget] = useState<TeacherListItem | null>(null)

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

  const { teachers, loading, submitting, register, toggleStatus } =
    useTeachers(filters)

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Gestión de Docentes
          </h1>
          <p className="text-muted-foreground">
            Administra los docentes registrados en la plataforma
          </p>
        </div>
        <RegisterTeacherDialog onRegister={register} submitting={submitting} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar docente por nombre o correo…"
            className="pl-9 pr-8 bg-secondary/30 border-border focus:border-primary focus:ring-primary/20"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-40 bg-secondary/30 border-border">
            <SelectValue placeholder="Filtrar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="bg-card border border-border rounded-lg flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Nombre
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Correo electrónico
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-40">
                    Usuario Linux
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32">
                    Provisionado
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">
                    Estado
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-44">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">
                        {teacher.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground font-mono">
                        {teacher.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {teacher.linuxUsername ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-mono text-foreground">
                          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                          {teacher.linuxUsername}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {teacher.linuxUsername ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full",
                            teacher.linuxProvisioned
                              ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                          )}
                        >
                          {teacher.linuxProvisioned ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Listo
                            </>
                          ) : (
                            <>
                              <CircleDashed className="w-3 h-3" />
                              Pendiente
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full",
                          teacher.active
                            ? "bg-green-500/10 text-green-600 border border-green-500/20"
                            : "bg-muted text-muted-foreground border border-border",
                        )}
                      >
                        {teacher.active ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            Activo
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            Inactivo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {teacher.active ? (
                          <button
                            onClick={() => handleToggle(teacher)}
                            title="Dar de baja"
                            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggle(teacher)}
                            title="Reactivar"
                            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-green-600 hover:bg-green-500/10 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {teachers.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {debouncedSearch || statusFilter !== "all"
                ? "No se encontraron docentes con los filtros actuales."
                : "No hay docentes registrados."}
            </div>
          )}
        </div>
      )}

      {/* Confirmación de baja */}
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
