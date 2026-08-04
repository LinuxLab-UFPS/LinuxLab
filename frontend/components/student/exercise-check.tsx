"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, CircleDashed, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api/client"
import { ActionButton } from "@/components/shared/action-button"

interface CheckResult {
  id: string
  type: string
  params: Record<string, string>
  points: number
  passed: boolean
  detail: string
}

interface Activity {
  slug: string
  title: string
  instructions: string | null
  maxScore: number
  checks: { id: string; type: string; params: Record<string, string>; points: number }[]
  lastAttempt: { passed: boolean; score: number; results: CheckResult[]; at: string } | null
}

/** Como se lee cada asercion del catalogo en la pantalla del estudiante. */
const DESCRIBE: Record<string, (p: Record<string, string>) => string> = {
  directorio_existe: (p) => `Existe el directorio ${p.ruta}`,
  archivo_existe: (p) => `Existe el archivo ${p.ruta}`,
  permisos_son: (p) => `${p.ruta} tiene permisos ${p.modo}`,
  propietario_es: (p) => `${p.ruta} pertenece a ${p.usuario}`,
  archivo_contiene: (p) => `${p.ruta} contiene "${p.patron}"`,
}

const describe = (type: string, params: Record<string, string>) =>
  DESCRIBE[type]?.(params) ?? type

/**
 * La practica evaluada de una leccion: el enunciado, lo que se va a revisar y el
 * boton que lo comprueba contra el entorno real del estudiante.
 *
 * Aqui no se decide nada: el navegador pide "evalua esta actividad" y el
 * servidor responde que paso y que no. El estudiante ve el detalle de cada
 * asercion para saber que le falta.
 */
export function ExerciseCheck({ slug }: { slug: string }) {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [results, setResults] = useState<CheckResult[] | null>(null)
  const [passed, setPassed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Activity>(`/api/activities/${slug}`)
      .then((data) => {
        setActivity(data)
        if (data.lastAttempt) {
          setResults(data.lastAttempt.results)
          setPassed(data.lastAttempt.passed)
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar la práctica"))
      .finally(() => setLoading(false))
  }, [slug])

  const check = useCallback(async () => {
    setChecking(true)
    setError(null)
    try {
      const outcome = await apiFetch<{ passed: boolean; results: CheckResult[] }>(
        `/api/activities/${slug}/check`,
        { method: "POST" },
      )
      setResults(outcome.results)
      setPassed(outcome.passed)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo comprobar tu entorno")
    } finally {
      setChecking(false)
    }
  }, [slug])

  if (loading) {
    return (
      <div className="my-8 flex items-center justify-center rounded-xl border border-table-line py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="my-8 rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
        {error ?? "Práctica no disponible"}
      </div>
    )
  }

  const rows = results ?? activity.checks.map((c) => ({ ...c, passed: false, detail: "" }))

  return (
    <section
      className={cn(
        "my-8 rounded-xl border transition-colors",
        passed ? "border-success/40" : "border-amber-500/30",
      )}
    >
      <header
        className={cn(
          "flex items-center gap-2.5 border-b px-5 py-3.5",
          passed ? "border-success/40" : "border-amber-500/30",
        )}
      >
        <ShieldCheck className={cn("h-4 w-4", passed ? "text-success" : "text-amber-500")} />
        <h3 className="text-sm font-semibold text-foreground">{activity.title}</h3>
        {passed && (
          <span className="ml-auto rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            Completada
          </span>
        )}
      </header>

      <div className="space-y-4 px-5 py-4">
        {activity.instructions && (
          <p className="text-sm leading-relaxed text-foreground">{activity.instructions}</p>
        )}

        <ul className="space-y-2">
          {rows.map((row) => {
            const evaluated = results !== null
            const Icon = !evaluated ? CircleDashed : row.passed ? CheckCircle2 : XCircle
            return (
              <li key={row.id} className="flex items-start gap-2.5 text-sm">
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    !evaluated
                      ? "text-muted-foreground"
                      : row.passed
                        ? "text-success"
                        : "text-danger",
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-foreground">
                    {describe(row.type, row.params)}
                  </span>
                  {evaluated && row.detail && (
                    <span
                      className={cn(
                        "block text-xs",
                        row.passed ? "text-muted-foreground" : "text-danger",
                      )}
                    >
                      {row.detail}
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>

        {error && (
          <p className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <ActionButton tone={passed ? "emerald" : "amber"} onClick={check} disabled={checking}>
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {checking ? "Comprobando..." : "Comprobar ejercicio"}
          </ActionButton>
          <p className="text-xs text-muted-foreground">
            Se revisa tu propia carpeta dentro del laboratorio.
          </p>
        </div>
      </div>
    </section>
  )
}
