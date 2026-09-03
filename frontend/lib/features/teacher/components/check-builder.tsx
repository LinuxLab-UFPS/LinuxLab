"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { checkParamsSummary, describeCheck } from "@shared/lib/describe-check"
import { checkError } from "@/lib/features/teacher/check-validation"
import { getCheckCatalog } from "@/lib/features/teacher/data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select"
import { Switch } from "@shared/components/ui/switch"
import { IconAction } from "@shared/components/icon-action"
import { Skeleton } from "@shared/components/skeleton"
import { notify } from "@shared/lib/toast"
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
 *
 * Cada asercion vive en una tarjeta colapsable: la fila cerrada basta para
 * leer la lista completa (numero, tipo, parametros y puntaje); al expandir se
 * editan los campos y se ve la frase "Resultado esperado" que le llegara al
 * docente en el detalle. Una recien agregada se abre sola.
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
  /** Ids de asercion expandidos; las demas quedan como fila resumen. */
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let alive = true
    getCheckCatalog()
      .then((entries) => {
        if (!alive) return
        setCatalog(entries)
      })
      .catch((e) => {
        if (alive) {
          setError("No se pudo cargar el catálogo de aserciones")
          notify.error(e, "No se pudo cargar el catálogo de aserciones")
        }
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

  const toggleOpen = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const evenPointsFor = (index: number, count = checks.length) => {
    if (count === 0) return 0
    const base = Math.floor(activityValue / count)
    const remainder = activityValue % count
    return base + (index < remainder ? 1 : 0)
  }

  const effectivePoints = (c: ActivityCheck, index: number) =>
    distributeEvenly ? evenPointsFor(index) : c.points

  const customTotal = checks.reduce((sum, c) => sum + (Number(c.points) || 0), 0)
  const exceeds = !distributeEvenly && customTotal > activityValue

  const addCheck = () => {
    const entry = catalog[0]
    if (!entry) return
    const newCount = checks.length + 1
    const next = distributeEvenly
      ? checks.map((check, index) => ({ ...check, points: evenPointsFor(index, newCount) }))
      : checks
    const id = crypto.randomUUID()
    onChange([
      ...next,
      {
        id,
        type: entry.type,
        params: {},
        points: evenPointsFor(checks.length, newCount),
      },
    ])
    // La nueva se abre sola: lo primero que hace el docente es definirla.
    setOpenIds((prev) => new Set(prev).add(id))
  }

  const updateCheck = (id: string, patch: Partial<ActivityCheck>) =>
    onChange(checks.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const updateParam = (id: string, key: string, value: string) =>
    onChange(
      checks.map((c) =>
        c.id === id ? { ...c, params: { ...c.params, [key]: value } } : c
      )
    )

  const removeCheck = (id: string) => {
    const remaining = checks.filter((c) => c.id !== id)
    onChange(
      distributeEvenly
        ? remaining.map((check, index) => ({ ...check, points: evenPointsFor(index, remaining.length) }))
        : remaining
    )
    setOpenIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error || catalog.length === 0) {
    return (
      <p className="rounded-md px-3 py-2 text-sm text-muted-foreground">
        {error ?? "El catálogo de aserciones está vacío"}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + distribute toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-foreground">Aserciones</h3>
          <span className="rounded-full border border-table-line bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {checks.length} {checks.length === 1 ? "validación" : "validaciones"}
          </span>
        </div>
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm">
          <span className="text-muted-foreground">Distribuir puntaje equitativamente</span>
          <Switch
            checked={distributeEvenly}
            onCheckedChange={(enabled) => {
              if (!enabled) {
                // Al apagar el reparto automatico los puntos quedan congelados
                // con los valores calculados, y de ahi en adelante son libres.
                onChange(checks.map((check, index) => ({ ...check, points: evenPointsFor(index) })))
              }
              onDistributeChange(enabled)
            }}
          />
        </label>
      </div>

      {/* Check list */}
      <div className="space-y-3">
        {checks.map((check, index) => {
          const entry = getEntry(check.type)
          const open = openIds.has(check.id)
          const paramError = checkError(check)
          const hasParams = entry.fields.some((f) => (check.params[f.key] ?? "").trim() !== "")
          return (
            <div
              key={check.id}
              className={cn(
                "overflow-hidden rounded-xl border bg-card transition-colors",
                open ? "border-primary/30" : "border-table-line",
                paramError && "border-danger/40",
              )}
            >
              {/* Fila resumen: siempre visible. Clic la expande o colapsa; los
                  controles de adentro matan el clic para no plegar la tarjeta. */}
              <button
                type="button"
                onClick={() => toggleOpen(check.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {entry.label}
                  </span>
                  {/* Con parametros invalidos la linea resumen se vuelve el
                      motivo, en rojo: el docente encuentra la tarjeta rota sin
                      abrir las demas. */}
                  <span
                    className={cn(
                      "block truncate font-mono text-xs",
                      paramError ? "text-danger" : "text-muted-foreground",
                    )}
                  >
                    {paramError ??
                      (hasParams
                        ? checkParamsSummary(check.type, check.params)
                        : "Sin configurar")}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-sm text-foreground">
                  {effectivePoints(check, index)} <span className="text-xs text-muted-foreground">pts</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                />
                <span onClick={(e) => e.stopPropagation()}>
                  <IconAction
                    label="Eliminar aserción"
                    icon={Trash2}
                    onClick={() => removeCheck(check.id)}
                  />
                </span>
              </button>

              {open && (
                <div className="space-y-4 border-t border-table-line px-4 py-4">
                  {/* Tipo: cambiarlo resetea los parametros, como siempre. */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Tipo de aserción</label>
                    <Select
                      value={check.type}
                      onValueChange={(type) => updateCheck(check.id, { type, params: {} })}
                    >
                      <SelectTrigger className="h-9 w-full border-table-line">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {catalog.map((c) => (
                          <SelectItem key={c.type} value={c.type}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Params */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {entry.fields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-xs text-muted-foreground">{field.label}</label>
                        <input
                          value={check.params[field.key] ?? ""}
                          onChange={(e) => updateParam(check.id, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="h-9 w-full rounded-md border border-table-line bg-card px-2.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Resultado esperado: qué evaluaría esta aserción con los
                      parámetros actuales. Es la misma frase que ve el docente
                      en el detalle de la actividad publicada. */}
                  <div className="flex items-start gap-3 rounded-lg border border-success/25 bg-success/5 px-3.5 py-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15">
                      <svg viewBox="0 0 16 16" className="h-3 w-3 fill-success" aria-hidden>
                        <path d="M6.5 11.5 3 8l1.06-1.06L6.5 9.38l5.44-5.44L13 5l-6.5 6.5Z" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">Resultado esperado</span>
                      <span className="mt-0.5 block whitespace-pre-wrap text-sm text-muted-foreground">
                        {describeCheck(check.type, check.params)}
                      </span>
                    </span>
                  </div>
                </div>
              )}
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
          className="inline-flex h-9 items-center gap-2 rounded-md border border-dashed border-primary/40 px-3.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
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
