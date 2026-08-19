"use client"

import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sendToTerminal } from "@/lib/features/student/terminal-input"
import { apiFetch } from "@/lib/api/client"
import { notify } from "@shared/lib/toast"
import { describeCheck } from "@shared/lib/describe-check"
import type { ActivityCheckResult, LessonActivity } from "@/lib/models/activities"

export type { ActivityCheckResult as CheckResult, LessonActivity } from "@/lib/models/activities"

export { describeCheck }

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
      notify.success("Archivos reiniciados")
    },
  })

  // Los errores de la actividad, la comprobación y el reinicio se avisan por
  // toast; la pantalla no vuelve a pintar ninguna caja de error.
  useEffect(() => {
    if (activityQuery.isError) {
      notify.error(activityQuery.error, "No se pudo cargar la actividad.")
    }
  }, [activityQuery.isError, activityQuery.error])

  useEffect(() => {
    if (checkMutation.isError) {
      notify.error(checkMutation.error, "No se pudo comprobar la actividad.")
    }
  }, [checkMutation.isError, checkMutation.error])

  useEffect(() => {
    if (resetMutation.isError) {
      notify.error(resetMutation.error, "No se pudieron reiniciar los archivos.")
    }
  }, [resetMutation.isError, resetMutation.error])

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
