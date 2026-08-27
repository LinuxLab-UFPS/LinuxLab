"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api/client"

/** La nota del último intento de una actividad. */
export interface ActivityScore {
  score: number
  maxScore: number
}

/**
 * Cómo va el estudiante en cada actividad: cuáles aprobó y qué nota sacó.
 *
 * Las tarjetas usan `passed` para la etiqueta de completada y `scores` para la
 * nota; el panel de la terminal usa `passed` para sugerir solo lo pendiente.
 * Una petición fallida deja las tarjetas sin etiquetas, nunca la página rota.
 */
export function usePassedActivities(): {
  passed: Set<string>
  scores: Record<string, ActivityScore>
  loading: boolean
} {
  const [passed, setPassed] = useState<Set<string>>(new Set())
  const [scores, setScores] = useState<Record<string, ActivityScore>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    apiFetch<{ passed: string[]; scores?: Record<string, ActivityScore> }>(
      "/api/activities/mine/status",
    )
      .then((data) => {
        if (!alive) return
        setPassed(new Set(data.passed))
        setScores(data.scores ?? {})
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { passed, scores, loading }
}
