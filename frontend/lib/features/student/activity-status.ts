"use client"

import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"

/** La nota del último intento de una actividad. */
export interface ActivityScore {
  score: number
  maxScore: number
}

/** La clave de caché, para que quien resuelva algo pueda invalidarla. */
export const ESTADO_ACTIVIDADES_KEY = ["activities-status"] as const

/**
 * Cómo va el estudiante en cada actividad: cuáles aprobó y qué nota sacó.
 *
 * Las tarjetas usan `passed` para la etiqueta de completada y `scores` para la
 * nota; el panel de la terminal usa `passed` para sugerir solo lo pendiente.
 * Una petición fallida deja las tarjetas sin etiquetas, nunca la página rota.
 *
 * Va por React Query y no por `useState` a proposito. La barra lateral, el mapa
 * del curso y las tarjetas llaman a este hook cada una por su lado: con estado
 * local, cada copia se quedaba con la foto del momento en que se monto, y
 * resolver una comprobacion no pintaba de verde la leccion hasta recargar la
 * pagina. Con una clave compartida, quien la resuelve invalida y todas se
 * enteran a la vez (ver `useActivityCheck`).
 */
export function usePassedActivities(): {
  passed: Set<string>
  scores: Record<string, ActivityScore>
  loading: boolean
} {
  const { data, isLoading } = useQuery({
    queryKey: ESTADO_ACTIVIDADES_KEY,
    queryFn: () =>
      apiFetch<{ passed: string[]; scores?: Record<string, ActivityScore> }>(
        "/api/activities/mine/status",
      ),
  })

  return {
    passed: new Set(data?.passed ?? []),
    scores: data?.scores ?? {},
    loading: isLoading,
  }
}
