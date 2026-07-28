"use client"

import { useState } from "react"
import { Search, Download, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { AuditEntry } from "@/lib/features/teacher/types"
import type { Role } from "@/lib/features/auth/types"
import { clearAuditLog } from "@/lib/features/teacher/data"

const PAGE_SIZE = 8

const roleLabel: Record<Role, string> = {
  student: "Estudiante",
  teacher: "Docente",
  admin: "Administrador",
}

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const [search, setSearch] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

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
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleClear = async () => {
    setError(null)
    try {
      await clearAuditLog()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar la bitácora.")
    }
  }

  return (
    <>
      {/* Summary card */}
      <div className="bg-card border border-border rounded-lg p-5 max-w-md">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-medium text-foreground">Bitácora de Accesos</h2>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {entries.length} registros
          </span>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-foreground hover:bg-secondary/50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Descargar
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-danger text-white hover:bg-danger/90 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Borrar bitácora
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Desde:</span>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Hasta:</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-12">N°</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-40">Entrada</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cursos</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-36">Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((entry) => {
                const date = new Date(entry.timestamp)
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{entry.id}</td>
                    <td className="px-4 py-3">
                      <span className="block text-sm text-foreground">
                        {date.toLocaleDateString("es-CO")}
                      </span>
                      <span className="block text-xs font-mono text-muted-foreground">
                        Hora: {date.toLocaleTimeString("es-CO")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-sm font-medium text-foreground">{entry.userName}</span>
                      <span className="block text-xs text-muted-foreground">{entry.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          entry.role === "student"
                            ? "bg-success/15 text-success"
                            : "bg-primary/15 text-primary"
                        )}
                      >
                        {roleLabel[entry.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[180px] truncate">
                      {entry.group}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{entry.action}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {paginated.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No se encontraron registros.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    </>
  )
}
