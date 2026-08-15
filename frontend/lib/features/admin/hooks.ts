"use client"

import { useQueryClient, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys, useTeachers as useTeachersQuery, useTeacherProvisioningJobs } from "@/lib/api/queries"
import * as adminData from "./data"
import type { TeacherFilters } from "./api"
import type { TeacherListItem } from "./types"

export function useTeachers(filters?: TeacherFilters) {
  const queryClient = useQueryClient()
  const teachersQuery = useTeachersQuery(filters)
  const jobsQuery = useTeacherProvisioningJobs()

  const registerMutation = useMutation({
    mutationFn: (input: { name: string; email: string }) => adminData.registerTeacher(input),
    onSuccess: (newTeacher) => {
      queryClient.setQueryData(
        queryKeys.teachers(filters),
        (prev: TeacherListItem[] = []) => [...prev, newTeacher],
      )
      toast.success("Docente registrado exitosamente")
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherJobs })
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Error al registrar docente")
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
      toast.success(updated.active ? "Docente reactivado" : "Docente dado de baja")
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Error al cambiar estado")
    },
  })

  return {
    teachers: teachersQuery.data ?? [],
    loading: teachersQuery.isLoading,
    provisioningJobs: jobsQuery.data ?? [],
    submitting: registerMutation.isPending,
    register: (name: string, email: string) => registerMutation.mutateAsync({ name, email }),
    toggleStatus: (id: string) => toggleMutation.mutateAsync(id),
  }
}
