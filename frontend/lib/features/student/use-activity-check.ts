"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sendToTerminal } from "@/lib/features/student/terminal-input"
import { apiFetch } from "@/lib/api/client"
import type { ActivityCheckResult, LessonActivity } from "@/lib/models/activities"

export type { ActivityCheckResult as CheckResult, LessonActivity } from "@/lib/models/activities"

/** Como se lee cada asercion del catalogo en la pantalla del estudiante. */
const DESCRIBE: Record<string, (p: Record<string, string>) => string> = {
  directorio_existe: (p) => `Existe el directorio ${p.ruta}`,
  archivo_existe: (p) => `Existe el archivo ${p.ruta}`,
  archivo_no_existe: (p) => `Ya no está ${p.ruta}`,
  permisos_son: (p) => `${p.ruta} tiene permisos ${p.modo}`,
  propietario_es: (p) => `${p.ruta} pertenece a ${p.usuario}`,
  archivo_es: (p) => `${p.ruta} tiene el contenido exacto`,
  minimo_lineas: (p) => `${p.ruta} tiene al menos ${p.cantidad} líneas`,
  ultima_linea_es: (p) => `La última línea de ${p.ruta} es ${p.valor}`,
  archivo_contiene: (p) => `${p.ruta} tiene el contenido esperado`,
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
  const queryClient = useQueryClient()
  const queryKey = ["lesson-activity", slug] as const

  const activityQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await apiFetch<LessonActivity>(`/api/activities/${slug}`)
      // Abrir la actividad deja los archivos listos. Sin `force` no toca nada
      // si ya existían, así que volver a entrar no borra lo que llevaba.
      if (data.hasSetup) {
        apiFetch(`/api/activities/${slug}/reset`, {
          method: "POST",
          body: JSON.stringify({ force: false }),
        }).catch(() => {})
      }
      return data
    },
    enabled: Boolean(slug),
  })

  const checkMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ passed: boolean; results: ActivityCheckResult[] }>(
        `/api/activities/${slug}/check`,
        { method: "POST" },
      ),
    onSuccess: (outcome) => {
      // El ultimo intento visto por la pantalla pasa a ser el de esta
      // comprobacion, sin recargar la actividad.
      queryClient.setQueryData<LessonActivity>(queryKey, (prev) =>
        prev
          ? {
              ...prev,
              lastAttempt: {
                passed: outcome.passed,
                score: 0,
                results: outcome.results,
                at: new Date().toISOString(),
              },
            }
          : prev,
      )
    },
  })

  const resetMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/activities/${slug}/reset`, {
        method: "POST",
        body: JSON.stringify({ force: true }),
      }),
    onSuccess: () => {
      queryClient.setQueryData<LessonActivity>(queryKey, (prev) =>
        prev ? { ...prev, lastAttempt: null } : prev,
      )
      // Reiniciar borra la carpeta y crea otra en su lugar. Una shell que
      // estuviera dentro se queda en el directorio viejo, que ya no figura en
      // ningún sitio: `pwd` sigue enseñando la ruta, `ls` no devuelve nada y lo
      // que se escriba ahí no llega a la carpeta nueva. El Ctrl+C limpia la
      // línea a medias que hubiera antes de mandar el `cd`.
      sendToTerminal("\x03cd ~\n")
    },
  })

  const activity = activityQuery.data ?? null
  const error =
    activityQuery.error ??
    checkMutation.error ??
    resetMutation.error ??
    null

  // Antes del primer intento se listan las aserciones sin veredicto.
  const rows: ActivityCheckResult[] =
    activity?.lastAttempt?.results ??
    (activity?.checks ?? []).map((c) => ({ ...c, passed: false, detail: "" }))

  return {
    activity,
    rows,
    evaluated: activity?.lastAttempt !== null && activity?.lastAttempt !== undefined,
    passed: activity?.lastAttempt?.passed ?? false,
    loading: activityQuery.isLoading,
    checking: checkMutation.isPending,
    resetting: resetMutation.isPending,
    error: error instanceof Error ? error.message : null,
    check: () => checkMutation.mutate(),
    reset: () => resetMutation.mutate(),
  }
}
