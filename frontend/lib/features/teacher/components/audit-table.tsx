"use client"

import { useState } from "react"
import { Search, Download, Trash2 } from "lucide-react"
import { Input } from "@shared/components/ui/input"
import { cn } from "@shared/lib/utils"
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
import type { AuditEntry } from "@/lib/features/teacher/types"
import type { Role } from "@/lib/features/auth/types"
import { clearAuditLog } from "@/lib/features/teacher/data"
import { ActionButton } from "@shared/components/action-button"
import { notifyPromise } from "@shared/lib/toast"

const PAGE_SIZE = 8

const ROLE: Record<Role, { label: string; className: string }> = {
  student: { label: "Estudiante", className: "bg-success/10 text-success border-success/30" },
  teacher: { label: "Docente", className: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  admin: {
    label: "Administrador",
    className: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  },
}

/** Exports the given rows as a CSV, honoring whatever search/date filter is active. */
function exportCsv(rows: AuditEntry[]) {
  const header = ["Fecha", "Hora", "Usuario", "Email", "Rol", "Acción", "Curso"]
  const lines = rows.map((e) => {
    const date = new Date(e.timestamp)
    return [
      date.toLocaleDateString("es-CO"),
      date.toLocaleTimeString("es-CO"),
      e.userName,
      e.email,
      ROLE[e.role].label,
      e.target ? `${e.action}: ${e.target}` : e.action,
      e.group,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  })
  const csv = [header.join(","), ...lines].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `bitacora-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const [search, setSearch] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [page, setPage] = useState(1)

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase()
    const matchesSearch =
      e.userName.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    const date = e.timestamp.slice(0, 10)
    const matchesDesde = !desde || date >= desde
    const matchesHasta = !hasta || date <= hasta
    return matchesSearch && matchesDesde && matchesHasta
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const pageRows = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  const handleClear = async () => {
    await notifyPromise(clearAuditLog(), {
      loading: "Borrando la bitácora…",
      success: "Bitácora borrada",
      error: "No se pudo borrar la bitácora.",
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="border-table-line pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Desde</span>
            <input
              type="date"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value)
                setPage(1)
              }}
              className="h-9 rounded-md border border-table-line bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Hasta</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value)
                setPage(1)
              }}
              className="h-9 rounded-md border border-table-line bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <ActionButton tone="neutral" onClick={() => exportCsv(filtered)}>
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Descargar
            </span>
          </ActionButton>
          <ActionButton tone="danger" onClick={handleClear}>
            <span className="inline-flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Borrar bitácora
            </span>
          </ActionButton>
        </div>
      </div>

      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-36">Entrada</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className="w-36">Rol</TableHead>
              <TableHead className="w-56">Acción</TableHead>
              <TableHead>Curso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((entry) => {
              const date = new Date(entry.timestamp)
              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    <span className="block text-sm text-foreground">
                      {date.toLocaleDateString("es-CO")}
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {date.toLocaleTimeString("es-CO")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm font-medium text-foreground">
                      {entry.userName}
                    </span>
                    <span className="block text-xs text-muted-foreground">{entry.email}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        ROLE[entry.role].className,
                      )}
                    >
                      {ROLE[entry.role].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm text-foreground">{entry.action}</span>
                    {entry.target && (
                      <span className="block text-xs font-medium text-amber-500">
                        {entry.target}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {entry.group}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <TableEmptyState>
            {entries.length === 0
              ? "Aún no hay registros en la bitácora."
              : "Ningún registro coincide con la búsqueda."}
          </TableEmptyState>
        )}
      </TablePanel>

      {filtered.length > 0 && (
        <TablePagination page={page_} totalPages={totalPages} onChange={setPage} tone="sky" />
      )}
    </div>
  )
}
