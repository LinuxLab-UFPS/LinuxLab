"use client"

import { useEffect, useRef } from "react"
import type { EnrollmentStudent } from "@/lib/models/auth"
import { listProvisioningJobs } from "@/lib/features/teacher/data"
import { hasToast, notifyLoading, notifyResolve } from "@shared/lib/toast"

/**
 * Sigue el aprovisionamiento de las cuentas del curso. El toast de carga lo
 * arrancó la publicación del curso con el id `prov-<groupId>`; mientras el
 * polling de useGroupStudents reporte cuentas pendientes, este hook lo
 * actualiza en el lugar ("3/10 cuentas creadas") y lo resuelve cuando todas
 * terminan. Si el toast ya no existe (curso visitado sin publicar, o sin
 * estudiantes) no hace nada.
 */
export function useProvisioningProgress(groupId: string, students?: EnrollmentStudent[]) {
  const resolved = useRef(false)

  useEffect(() => {
    if (!students || students.length === 0) return
    const toastId = `prov-${groupId}`
    if (!hasToast(toastId)) return

    const pending = students.filter((s) => !s.linuxProvisioned)
    if (pending.length > 0) {
      const done = students.length - pending.length
      notifyLoading(`Creando cuentas en el entorno… ${done}/${students.length}`, { id: toastId })
      return
    }

    if (resolved.current) return
    resolved.current = true

    void listProvisioningJobs(groupId)
      .then((jobs) => {
        const failed = jobs.filter((j) => j.status === "failed").length
        if (failed > 0) {
          notifyResolve(toastId, {
            ok: false,
            message: `${failed} cuenta(s) fallaron en el entorno`,
            description: "Revisa el estado de cada cuenta en el curso.",
          })
        } else {
          notifyResolve(toastId, {
            ok: true,
            message: `${students.length} estudiantes listos en el entorno`,
          })
        }
      })
      .catch(() => {
        notifyResolve(toastId, {
          ok: true,
          message: `${students.length} estudiantes listos en el entorno`,
        })
      })
  }, [groupId, students])
}
