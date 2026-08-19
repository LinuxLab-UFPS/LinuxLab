"use client"

import { useState } from "react"
import { Search, Download } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { downloadExcel, tableToSheet } from "@shared/lib/excel"
import { notify } from "@shared/lib/toast"
import { useAuditLog } from "@/lib/api/queries"
import { teacherApi } from "@/lib/features/teacher/api"
import type { AuditEntry, AuditFilters } from "@/lib/features/teacher/types"
import type { Role } from "@/lib/features/auth/types"

const PAGE_SIZE = 20

const CATEGORIES = [
  { value: "", label: "Todas las categorías" },
  { value: "sesiones", label: "Sesiones" },
  { value: "actividades", label: "Actividades" },
  { value: "administracion", label: "Administración" },
  { value: "cursos", label: "Cursos" },
  { value: "matriculas", label: "Matrículas" },
] as const

const ROLE: Record<Role, { label: string; className: string }> = {
  student: { label: "Estudiante", className: "bg-success/10 text-success border-success/30" },
  teacher: { label: "Docente", className: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  admin: {
    label: "Administrador",
    className: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  },
}

function roleBadge(role: AuditEntry["role"]) {
  if (role === "student" || role === "teacher" || role === "admin") return ROLE[role]
  return { label: "—", className: "bg-muted/10 text-muted-foreground border-border/30" }
}

/** Exporta TODOS los registros filtrados del curso, paginando por lotes. */
async function exportAll(base: AuditFilters, groupId: string, setBusy: (b: boolean) => void) {
  setBusy(true)
  try {
    let page = 1
    let acc: AuditEntry[] = []
    let total = Infinity
    while (acc.length < total) {
      const res = await teacherApi.listAuditLog({ ...base, groupId, page, limit: 100 })
      acc = acc.concat(res.entries)
      total = res.total
      if (res.entries.length === 0) break
      page += 1
    }
    const rows = acc.map((e) => [
      new Date(e.timestamp).toLocaleString("es-CO"),
      e.userName ?? "—",
      e.email ?? "—",
      roleBadge(e.role).label,
      e.message,
    ])
    await downloadExcel({
      fileName: `bitacora-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheets: [
        tableToSheet({
          name: "Bitácora",
          headers: ["Fecha", "Usuario", "Email", "Rol", "Acción"],
          rows,
        }),
      ],
    })
    notify.success("Excel generado", { description: "Se descargó la bitácora del curso." })
  } finally {
    setBusy(false)
  }
}

export function GroupAuditPanel({ groupId }: { groupId: string }) {
  const [category, setCategory] = useState("")
  const [search, setSearch] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  const filters: AuditFilters = {
    category: category || undefined,
    search: search || undefined,
    from: desde || undefined,
    to: hasta || undefined,
    page,
    limit: PAGE_SIZE,
  }

  const { data, isLoading } = useAuditLog({ ...filters, groupId })

  const entries = data?.entries ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div data-section="audit-panel">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por mensaje, nombre o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="border-table-line pl-9"
          />
        </div>

        <Select value={category} onValueChange={(v) => {
          setCategory(v)
          setPage(1)
        }}>
          <SelectTrigger className="w-auto min-w-[180px] border-table-line">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Desde</span>
          <input
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value)
              setPage(1)
            }}
            className="h-9 rounded-md border border-table-line bg-background px-2 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark]"
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
            className="h-9 rounded-md border border-table-line bg-background px-2 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        <button
          type="button"
          onClick={() => exportAll(filters, groupId, setExporting)}
          disabled={exporting || total === 0}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Generando…" : "Exportar Excel"}
        </button>
      </div>

      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-36">Entrada</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className="w-36">Rol</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const date = new Date(entry.timestamp)
              const badge = roleBadge(entry.role)
              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    <span className="block text-sm text-foreground">{date.toLocaleDateString("es-CO")}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{date.toLocaleTimeString("es-CO")}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm font-medium text-foreground">{entry.userName ?? "—"}</span>
                    <span className="block text-xs text-muted-foreground">{entry.email ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", badge.className)}>
                      {badge.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm text-foreground">{entry.message}</span>
                    {entry.target && (
                      <span className="block text-xs font-medium text-amber-500">{entry.action}</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {isLoading ? (
          <TableEmptyState>Cargando…</TableEmptyState>
        ) : entries.length === 0 ? (
          <TableEmptyState>Aún no hay registros en la bitácora de este curso.</TableEmptyState>
        ) : null}
      </TablePanel>

      {totalPages > 1 && (
        <TablePagination page={page} totalPages={totalPages} onChange={setPage} tone="sky" />
      )}
      <div className="mt-2 text-right text-xs text-muted-foreground">
        {total} registro(s)
      </div>
    </div>
  )
}
