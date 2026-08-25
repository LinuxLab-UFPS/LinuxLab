"use client"

import { useEffect, useRef } from "react"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { queryKeys, useTeachers as useTeachersQuery, useTeacherProvisioningJobs } from "@/lib/api/queries"
import * as adminData from "./data"
import type { TeacherFilters } from "./api"
import type { TeacherListItem } from "./types"
import { notify, notifyLoading, notifyPromise } from "@shared/lib/toast"

export function useTeachers(filters?: TeacherFilters) {
  const queryClient = useQueryClient()
  const teachersQuery = useTeachersQuery(filters)
  const jobsQuery = useTeacherProvisioningJobs()

  // El error de carga de la tabla era silencioso: se avisa con un toast, una
  // sola vez por error distinto (cada reintento de react-query falla de nuevo).
  const lastErrorMsg = useRef<string | null>(null)
  useEffect(() => {
    if (!teachersQuery.error) return
    const msg = teachersQuery.error instanceof Error ? teachersQuery.error.message : String(teachersQuery.error)
    if (msg === lastErrorMsg.current) return
    lastErrorMsg.current = msg
    notify.error(teachersQuery.error, "No se pudieron cargar los docentes")
  }, [teachersQuery.error])

  const registerMutation = useMutation({
    mutationFn: (input: { name: string; email: string; code: string }) => adminData.registerTeacher(input),
    onSuccess: (newTeacher) => {
      queryClient.setQueryData(
        queryKeys.teachers(filters),
        (prev: TeacherListItem[] = []) => [...prev, newTeacher],
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherJobs })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminData.toggleTeacherStatus(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        queryKeys.teachers(filters),
        (prev: TeacherListItem[] = []) =>
          prev?.map((t) => (t.id === updated.id ? updated : t)) ?? [],
      )
    },
  })

  const register = async (name: string, email: string, code: string) => {
    const created = await notifyPromise(registerMutation.mutateAsync({ name, email, code }), {
      loading: "Registrando docente…",
      success: "Docente registrado exitosamente",
      error: "Error al registrar docente",
    })
    if (created.ok) {
      notifyLoading(`Creando cuenta de ${created.data.name} en el entorno…`, {
        id: `prov-teacher-${created.data.email}`,
      })
    }
    return created.ok ? created.data : undefined
  }

  const toggleStatus = async (id: string) => {
    await notifyPromise(toggleMutation.mutateAsync(id), {
      loading: "Actualizando el estado…",
      success: (updated) => (updated.active ? "Docente reactivado" : "Docente dado de baja"),
      error: "Error al cambiar estado",
    })
  }

  return {
    teachers: teachersQuery.data ?? [],
    loading: teachersQuery.isLoading,
    provisioningJobs: jobsQuery.data ?? [],
    submitting: registerMutation.isPending,
    register,
    toggleStatus,
  }
}
