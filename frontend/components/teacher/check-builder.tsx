"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, ShieldCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCheckCatalog } from "@/lib/features/teacher/data"
import type { ActivityCheck, CatalogEntry } from "@/lib/features/teacher/types"

export type { ActivityCheck }

interface CheckBuilderProps {
  checks: ActivityCheck[]
  onChange: (checks: ActivityCheck[]) => void
  activityValue: number
  distributeEvenly: boolean
  onDistributeChange: (v: boolean) => void
}

/**
 * Constructor de aserciones. El catalogo lo sirve el backend
 * (`GET /api/activities/catalog`): la interfaz muestra exactamente los tipos
 * que la validacion acepta, y un tipo nuevo llega solo con anadirlo al checker
 * del entorno y al catalogo del servidor.
 */
export function CheckBuilder({
  checks,
  onChange,
  activityValue,
  distributeEvenly,
  onDistributeChange,
}: CheckBuilderProps) {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getCheckCatalog()
      .then((entries) => {
        if (!alive) return
        setCatalog(entries)
      })
      .catch(() => {
        if (alive) setError("No se pudo cargar el catálogo de aserciones")
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const getEntry = (type: string) =>
    catalog.find((c) => c.type === type) ?? catalog[0]

  const evenPoints =
    checks.length > 0 ? Math.round((activityValue / checks.length) * 10) / 10 : 0

  const effectivePoints = (c: ActivityCheck) =>
    distributeEvenly ? evenPoints : c.points

  const customTotal = checks.reduce((sum, c) => sum + (Number(c.points) || 0), 0)
  const exceeds = !distributeEvenly && customTotal > activityValue

  const addCheck = () => {
    const entry = catalog[0]
    if (!entry) return
    onChange([
      ...checks,
      {
        id: crypto.randomUUID(),
        type: entry.type,
        params: {},
        points: evenPoints || activityValue,
      },
    ])
  }

  const updateCheck = (id: string, patch: Partial<ActivityCheck>) =>
    onChange(checks.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const updateParam = (id: string, key: string, value: string) =>
    onChange(
      checks.map((c) =>
        c.id === id ? { ...c, params: { ...c.params, [key]: value } } : c
      )
    )

  const removeCheck = (id: string) => onChange(checks.filter((c) => c.id !== id))

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando catálogo de aserciones…
      </div>
    )
  }

  if (error || catalog.length === 0) {
    return (
      <div className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
        {error ?? "El catálogo de aserciones está vacío"}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + distribute toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>
            {checks.length} {checks.length === 1 ? "aserción" : "aserciones"} de validación
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={distributeEvenly}
            onChange={(e) => onDistributeChange(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-muted-foreground">Distribuir puntaje equitativamente</span>
        </label>
      </div>

      {/* Check list */}
      <div className="space-y-3">
        {checks.map((check, index) => {
          const entry = getEntry(check.type)
          return (
            <div key={check.id} className="space-y-3 rounded-lg border border-table-line bg-secondary/40 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-foreground/10 font-mono text-xs font-medium text-foreground">
                  {index + 1}
                </span>
                {/* Type selector */}
                <select
                  value={check.type}
                  onChange={(e) => updateCheck(check.id, { type: e.target.value, params: {} })}
                  className="h-9 flex-1 rounded-md border border-table-line bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {catalog.map((c) => (
                    <option key={c.type} value={c.type}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {/* Points */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={0}
                    value={effectivePoints(check)}
                    disabled={distributeEvenly}
                    onChange={(e) => updateCheck(check.id, { points: Number(e.target.value) })}
                    className={cn(
                      "h-9 w-16 rounded-md border border-table-line bg-card px-2 text-center font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary",
                      distributeEvenly && "opacity-60"
                    )}
                  />
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
                {/* Remove */}
                <button
                  onClick={() => removeCheck(check.id)}
                  title="Eliminar aserción"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Params */}
              <div className="grid gap-3 pl-9 sm:grid-cols-2">
                {entry.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-xs text-muted-foreground">{field.label}</label>
                    <input
                      value={check.params[field.key] ?? ""}
                      onChange={(e) => updateParam(check.id, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="h-8 w-full rounded-md border border-table-line bg-card px-2.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>

              <p className="pl-9 text-xs text-muted-foreground">{entry.hint}</p>
            </div>
          )
        })}

        {checks.length === 0 && (
          <div className="rounded-lg border border-dashed border-table-line px-4 py-8 text-center text-sm text-muted-foreground">
            Aún no has agregado aserciones. La actividad no podrá validarse hasta tener al menos una.
          </div>
        )}
      </div>

      {/* Add + total */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={addCheck}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-table-line px-3 text-sm text-foreground transition-colors hover:bg-secondary"
        >
          <Plus className="h-4 w-4" />
          Agregar aserción
        </button>

        <div className="text-sm">
          <span className="text-muted-foreground">Total asignado: </span>
          <span
            className={cn(
              "font-mono font-medium",
              exceeds ? "text-danger" : "text-foreground"
            )}
          >
            {distributeEvenly ? activityValue : customTotal}
          </span>
          <span className="text-muted-foreground"> / {activityValue} pts</span>
          {exceeds && (
            <span className="ml-2 text-xs text-danger">
              La suma no puede superar los {activityValue} pts.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
