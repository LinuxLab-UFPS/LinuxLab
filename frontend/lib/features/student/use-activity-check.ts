"use client"

import { useCallback, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { avisarResultado, type TipoDeReto } from "./terminal-aviso"
import { entrarEnActividad } from "@/lib/features/student/directorio-terminal"
import { apiFetch } from "@/lib/api/client"
import { ESTADO_ACTIVIDADES_KEY } from "@/lib/features/student/activity-status"
import { notify } from "@shared/lib/toast"
import { describeCheck } from "@shared/lib/describe-check"
import type { ActivityCheckResult, LessonActivity } from "@/lib/models/activities"

export type { ActivityCheckResult as CheckResult, LessonActivity } from "@/lib/models/activities"

export { describeCheck }

export const lessonActivityKey = (slug: string) => ["lesson-activity", slug] as const

/**
 * La consulta de la actividad, para poder compartirla.
 *
 * La usan el panel y el espacio de trabajo, que necesita el directorio de la
 * actividad para llevar la terminal a el. Al ser la misma clave, react-query la
 * atiende una sola vez: no hay dos peticiones ni dos reinicios.
 */
export function lessonActivityQuery(slug: string) {
  return {
    queryKey: lessonActivityKey(slug),
    queryFn: () => apiFetch<LessonActivity>(`/api/activities/${slug}`),
    enabled: Boolean(slug),
  }
}

export const activitySandboxKey = (slug: string) => ["activity-sandbox", slug] as const

/**
 * Los archivos de partida de la actividad, preparados al abrirla.
 *
 * Va en su propia consulta, y no dentro de la de la actividad, por dos razones.
 * La primera es el orden. La terminal entra en el directorio con `mkdir -p` y
 * antes lo hacia a la vez que esta preparacion. Si el `mkdir` ganaba, el
 * directorio quedaba vacio. Ahora `useDirectorioAutomatico` espera a esta
 * consulta antes de mandar la terminal, asi que la preparacion siempre va
 * primero. La segunda es que el panel no tiene por que esperar. El enunciado se
 * pinta en cuanto llega la actividad y solo el `cd` aguarda a los archivos.
 *
 * Sin `force` no toca un directorio con trabajo, asi que volver a entrar no
 * borra nada. Y no caduca, porque repetirla en cada visita solo cargaria el
 * servidor. Si el estudiante necesita rehacerla, para eso esta el boton.
 */
export function activitySandboxQuery(slug: string, hasSetup: boolean) {
  return {
    queryKey: activitySandboxKey(slug),
    queryFn: () =>
      apiFetch<{ root: string; creados: number; yaEstaba: boolean }>(
        `/api/activities/${slug}/reset`,
        { method: "POST", body: JSON.stringify({ force: false }) },
      ),
    enabled: Boolean(slug) && hasSetup,
    staleTime: Infinity,
    retry: 1,
  }
}

/**
 * Loads an activity and evaluates it on demand.
 *
 * Nothing is decided here: the browser asks "evaluate this activity" and the
 * server answers what passed and what did not. The student is always taken from
 * the session, never from the request.
 */
export function useActivityCheck(slug: string, tipo: TipoDeReto = "actividad") {
  const queryClient = useQueryClient()
  const queryKey = lessonActivityKey(slug)

  const activityQuery = useQuery(lessonActivityQuery(slug))
  // El panel tambien la pide por si se abre sin la terminal. Es la misma clave
  // que usa `useDirectorioAutomatico`, asi que la peticion sale una sola vez.
  const sandboxQuery = useQuery(
    activitySandboxQuery(slug, Boolean(activityQuery.data?.hasSetup)),
  )

  const checkMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ passed: boolean; score: number; results: ActivityCheckResult[] }>(
        `/api/activities/${slug}/check`,
        { method: "POST" },
      ),
    onSuccess: (outcome) => {
      // El veredicto tambien se escribe en la terminal: es donde el estudiante
      // esta mirando mientras trabaja. El detalle de cada asercion se queda en
      // el panel, que es donde se lee sin enterrar la consola.
      const total = outcome.results.reduce((suma, row) => suma + row.points, 0)
      avisarResultado(tipo, outcome.passed, outcome.score, total)

      // El ultimo intento visto por la pantalla pasa a ser el de esta
      // comprobacion, sin recargar la actividad.
      queryClient.setQueryData<LessonActivity>(queryKey, (prev) =>
        prev
          ? {
              ...prev,
              lastAttempt: {
                passed: outcome.passed,
                score: outcome.score,
                results: outcome.results,
                at: new Date().toISOString(),
              },
            }
          : prev,
      )
      // Y el estado global, que es de donde sacan el verde la barra lateral, el
      // mapa del curso y las tarjetas. Sin esto la tarjeta se ponia verde y el
      // resto de la pagina seguia diciendo que faltaba.
      queryClient.invalidateQueries({ queryKey: ESTADO_ACTIVIDADES_KEY })
    },
  })

  const resetMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ root: string; creados: number; yaEstaba: boolean }>(`/api/activities/${slug}/reset`, {
        method: "POST",
        body: JSON.stringify({ force: true }),
      }),
    onSuccess: (preparado) => {
      // Los archivos ya estan: si la preparacion al abrir habia fallado, la
      // consulta deja de figurar con error.
      queryClient.setQueryData(activitySandboxKey(slug), preparado)
      const workdir = queryClient.getQueryData<LessonActivity>(queryKey)?.workdir
      queryClient.setQueryData<LessonActivity>(queryKey, (prev) =>
        prev ? { ...prev, lastAttempt: null } : prev,
      )
      queryClient.invalidateQueries({ queryKey: ESTADO_ACTIVIDADES_KEY })
      // Reiniciar borra el directorio y crea otro en su lugar. Una shell que
      // estuviera dentro se queda en el directorio viejo, que ya no figura en
      // ningún sitio: `pwd` sigue enseñando la ruta, `ls` no devuelve nada y lo
      // que se escriba ahí no llega al directorio nuevo. Se la vuelve a meter en
      // la misma ruta, ver `entrarEnActividad`.
      //
      // La orden va con `\x15` (Ctrl+U) y no con `\x03` (Ctrl+C), que ensuciaba
      // la terminal por partida doble: bash hace eco de un `^C`, y como la señal
      // viaja pegada al comando en el mismo envío, se come parte del buffer.
      // Ctrl+U no es una señal: la consume la disciplina de linea sin eco.
      if (workdir) entrarEnActividad(workdir)
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

  // Callado, el estudiante encontraba el directorio vacio y creia que la
  // actividad era asi.
  useEffect(() => {
    if (sandboxQuery.isError) {
      notify.error(sandboxQuery.error, "No se pudieron preparar los archivos. Usa «Reiniciar archivos».")
    }
  }, [sandboxQuery.isError, sandboxQuery.error])

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

  /* Memorizadas porque las pantallas las publican al modal de la terminal desde
     un efecto: sin identidad estable, cada render publicaba de nuevo, el
     proveedor cambiaba de estado y volvia a renderizar, en bucle hasta tumbar
     la pestaña. Las de react-query ya son estables, son estos envoltorios los
     que no lo eran. */
  const { mutate: mutarCheck } = checkMutation
  const { mutate: mutarReset } = resetMutation
  const check = useCallback(() => mutarCheck(), [mutarCheck])
  const reset = useCallback(() => mutarReset(), [mutarReset])

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
    check,
    reset,
  }
}
