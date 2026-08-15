"use client"

import { useEffect, useRef } from "react"
import type { TeacherProvisioningJobSummary } from "@/lib/features/admin/types"
import { hasToast, notifyResolve } from "@shared/lib/toast"

/**
 * Resuelve el toast de carga que arrancó el registro de un docente
 * (`prov-teacher-<email>`) cuando su job de aprovisionamiento termina.
 * Solo actúa si el toast sigue vivo: si el admin vuelve a la vista más
 * tarde, el estado del job se muestra en el badge de la fila.
 */
export function useTeacherProvisioningToast(jobs: TeacherProvisioningJobSummary[]) {
  const resolvedJobs = useRef(new Set<string>())

  useEffect(() => {
    for (const job of jobs) {
      if (resolvedJobs.current.has(job.id)) continue
      if (job.status !== "completed" && job.status !== "failed") continue

      const toastId = `prov-teacher-${job.teacher.email}`
      resolvedJobs.current.add(job.id)

      if (!hasToast(toastId)) continue

      if (job.status === "completed") {
        notifyResolve(toastId, {
          ok: true,
          message: `Docente ${job.teacher.name} listo en el entorno`,
        })
      } else {
        notifyResolve(toastId, {
          ok: false,
          message: `No se pudo provisionar la cuenta de ${job.teacher.name}`,
          description: job.error ?? undefined,
        })
      }
    }
  }, [jobs])
}
