"use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api/client"

export interface CheckResult {
  id: string
  type: string
  params: Record<string, string>
  points: number
  passed: boolean
  detail: string
}

export interface CheckedActivity {
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

export function describeCheck(type: string, params: Record<string, string>): string {
  return DESCRIBE[type]?.(params) ?? type
}

/**
 * Loads an activity and evaluates it on demand.
 *
 * Nothing is decided here: the browser asks "evaluate this activity" and the
 * server answers what passed and what did not. The student is always taken from
 * the session, never from the request.
 */
export function useActivityCheck(slug: string) {
  const [activity, setActivity] = useState<CheckedActivity | null>(null)
  const [results, setResults] = useState<CheckResult[] | null>(null)
  const [passed, setPassed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    apiFetch<CheckedActivity>(`/api/activities/${slug}`)
      .then((data) => {
        if (!alive) return
        setActivity(data)
        if (data.lastAttempt) {
          setResults(data.lastAttempt.results)
          setPassed(data.lastAttempt.passed)
        }
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "No se pudo cargar la práctica")
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
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

  /** Antes del primer intento se listan las aserciones sin veredicto. */
  const rows: CheckResult[] =
    results ?? (activity?.checks ?? []).map((c) => ({ ...c, passed: false, detail: "" }))

  return { activity, rows, evaluated: results !== null, passed, loading, checking, error, check }
}
