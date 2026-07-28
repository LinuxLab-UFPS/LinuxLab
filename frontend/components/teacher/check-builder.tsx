"use client"

import { Plus, Trash2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivityCheck } from "@/lib/features/teacher/types"

export type { ActivityCheck }

interface Field {
  key: string
  label: string
  placeholder: string
}

interface CatalogEntry {
  type: string
  label: string
  hint: string
  fields: Field[]
}

/** Catálogo predefinido de aserciones (RF-17). El docente solo elige y rellena. */
export const CHECK_CATALOG: CatalogEntry[] = [
  {
    type: "archivo_existe",
    label: "El archivo existe",
    hint: "Verifica que exista un archivo en la ruta indicada.",
    fields: [{ key: "ruta", label: "Ruta del archivo", placeholder: "/home/$usuario/notas.txt" }],
  },
  {
    type: "directorio_existe",
    label: "El directorio existe",
    hint: "Verifica que exista un directorio en la ruta indicada.",
    fields: [{ key: "ruta", label: "Ruta del directorio", placeholder: "/home/$usuario/practicas" }],
  },
  {
    type: "permisos_son",
    label: "Los permisos son",
    hint: "Compara los permisos del archivo con el modo octal esperado.",
    fields: [
      { key: "ruta", label: "Ruta", placeholder: "/home/$usuario/script.sh" },
      { key: "modo", label: "Modo (octal)", placeholder: "755" },
    ],
  },
  {
    type: "propietario_es",
    label: "El propietario es",
    hint: "Verifica el usuario propietario del archivo o directorio.",
    fields: [
      { key: "ruta", label: "Ruta", placeholder: "/home/$usuario/archivo" },
      { key: "usuario", label: "Usuario esperado", placeholder: "$usuario" },
    ],
  },
  {
    type: "archivo_contiene",
    label: "El archivo contiene",
    hint: "Busca un texto o patrón dentro del contenido del archivo.",
    fields: [
      { key: "ruta", label: "Ruta", placeholder: "/home/$usuario/.bashrc" },
      { key: "patron", label: "Texto o patrón", placeholder: "export PATH=" },
    ],
  },
  {
    type: "comando_imprime",
    label: "El comando imprime",
    hint: "Ejecuta un comando y verifica que su salida contenga el texto esperado.",
    fields: [
      { key: "comando", label: "Comando", placeholder: "ls -a" },
      { key: "salida", label: "Salida esperada (contiene)", placeholder: ".bashrc" },
    ],
  },
  {
    type: "comprimido_contiene",
    label: "El comprimido contiene",
    hint: "Verifica que un archivo comprimido incluya los archivos esperados.",
    fields: [
      { key: "archivo", label: "Archivo comprimido", placeholder: "backup.tar.gz" },
      { key: "contenidos", label: "Archivos esperados (separa con coma)", placeholder: "a.txt, b.txt" },
    ],
  },
  {
    type: "umask_es",
    label: "El umask es",
    hint: "Ejecuta umask en la sesión del estudiante y compara el valor.",
    fields: [{ key: "valor", label: "Valor esperado", placeholder: "022" }],
  },
]

function getEntry(type: string) {
  return CHECK_CATALOG.find((c) => c.type === type) ?? CHECK_CATALOG[0]
}

interface CheckBuilderProps {
  checks: ActivityCheck[]
  onChange: (checks: ActivityCheck[]) => void
  activityValue: number
  distributeEvenly: boolean
  onDistributeChange: (v: boolean) => void
}

export function CheckBuilder({
  checks,
  onChange,
  activityValue,
  distributeEvenly,
  onDistributeChange,
}: CheckBuilderProps) {
  const evenPoints =
    checks.length > 0 ? Math.round((activityValue / checks.length) * 10) / 10 : 0

  const effectivePoints = (c: ActivityCheck) =>
    distributeEvenly ? evenPoints : c.points

  const customTotal = checks.reduce((sum, c) => sum + (Number(c.points) || 0), 0)
  const mismatch = !distributeEvenly && Math.abs(customTotal - activityValue) > 0.5

  const addCheck = () => {
    const entry = CHECK_CATALOG[0]
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

  return (
    <div className="space-y-4">
      {/* Header + distribute toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>
            {checks.length} {checks.length === 1 ? "aserción" : "aserciones"} de validación
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={distributeEvenly}
            onChange={(e) => onDistributeChange(e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <span className="text-muted-foreground">Distribuir puntaje equitativamente</span>
        </label>
      </div>

      {/* Check list */}
      <div className="space-y-3">
        {checks.map((check, index) => {
          const entry = getEntry(check.type)
          return (
            <div key={check.id} className="bg-secondary/30 border border-border rounded-md p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 shrink-0 rounded-md bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                {/* Type selector */}
                <select
                  value={check.type}
                  onChange={(e) => updateCheck(check.id, { type: e.target.value, params: {} })}
                  className="flex-1 h-9 bg-card border border-border rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CHECK_CATALOG.map((c) => (
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
                      "w-16 h-9 bg-card border border-border rounded-md px-2 text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-primary",
                      distributeEvenly && "opacity-60"
                    )}
                  />
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
                {/* Remove */}
                <button
                  onClick={() => removeCheck(check.id)}
                  title="Eliminar aserción"
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Params */}
              <div className="pl-9 grid gap-3 sm:grid-cols-2">
                {entry.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-xs text-muted-foreground">{field.label}</label>
                    <input
                      value={check.params[field.key] ?? ""}
                      onChange={(e) => updateParam(check.id, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full h-8 bg-card border border-border rounded-md px-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>

              <p className="pl-9 text-xs text-muted-foreground">{entry.hint}</p>
            </div>
          )
        })}

        {checks.length === 0 && (
          <div className="border border-dashed border-border rounded-md px-4 py-8 text-center text-sm text-muted-foreground">
            Aún no has agregado aserciones. La actividad no podrá validarse hasta tener al menos una.
          </div>
        )}
      </div>

      {/* Add + total */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={addCheck}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm text-foreground hover:bg-secondary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar aserción
        </button>

        <div className="text-sm">
          <span className="text-muted-foreground">Total asignado: </span>
          <span
            className={cn(
              "font-mono font-medium",
              mismatch ? "text-danger" : "text-foreground"
            )}
          >
            {distributeEvenly ? activityValue : customTotal}
          </span>
          <span className="text-muted-foreground"> / {activityValue} pts</span>
          {mismatch && (
            <span className="ml-2 text-xs text-danger">
              La suma debe igualar el valor de la actividad.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
