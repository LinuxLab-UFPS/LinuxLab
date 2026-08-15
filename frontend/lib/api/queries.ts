"use client"

import { useQuery } from "@tanstack/react-query"
import * as teacherData from "@/lib/features/teacher/data"
import * as adminData from "@/lib/features/admin/data"
import type { GroupProgressSummary } from "@/lib/models/groups"
import type { EnrollmentStudent } from "@/lib/models/auth"
import type { TeacherProvisioningJobSummary } from "@/lib/features/admin/types"
import { EMPTY_PROGRESS } from "@/lib/models/groups"

export const queryKeys = {
  groups: ["groups"] as const,
  group: (id: string) => ["groups", id] as const,
  groupProgress: (id: string) => ["groups", id, "progress"] as const,
  groupStudents: (id: string) => ["groups", id, "students"] as const,
  groupActivities: (id: string) => ["groups", id, "activities"] as const,
  teacherJobs: ["admin", "teacher-jobs"] as const,
  teachers: (filters?: { search?: string; status?: string }) => ["admin", "teachers", filters] as const,
}

/** Cursos del docente. */
export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: teacherData.listGroups,
  })
}

/** Un curso, refrescado mientras haya cuentas por provisionar. */
export function useGroup(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.group(id),
    queryFn: () => teacherData.getGroup(id),
    enabled: Boolean(id) && enabled,
    refetchInterval: 5000,
  })
}

/** Estudiantes de un curso; refresca cada 5s mientras alguno no este provisionado. */
export function useGroupStudents(id: string) {
  return useQuery({
    queryKey: queryKeys.groupStudents(id),
    queryFn: () => teacherData.listStudents(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const students = query.state.data
      const pending = students?.some((s: EnrollmentStudent) => !s.linuxProvisioned)
      return pending ? 5000 : false
    },
  })
}

/** Actividades publicadas en el curso. */
export function useGroupActivities(id: string) {
  return useQuery({
    queryKey: queryKeys.groupActivities(id),
    queryFn: () => teacherData.listGroupActivities(id),
    enabled: Boolean(id),
  })
}

/**
 * Progreso del curso. El endpoint aun no existe en el backend: los stubs de
 * teacher/data.ts devuelven el resumen vacio hasta que se implemente.
 */
export function useGroupProgress(id: string): GroupProgressSummary {
  const query = useQuery({
    queryKey: queryKeys.groupProgress(id),
    queryFn: () => teacherData.getGroupProgress(id),
    enabled: false,
  })
  return query.data ?? EMPTY_PROGRESS
}

/** Docentes (vista de admin). */
export function useTeachers(filters?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: queryKeys.teachers(filters),
    queryFn: () => adminData.listTeachers(filters),
  })
}

/** Jobs de aprovisionamiento de docentes; refresca cada 5s mientras haya pendientes. */
export function useTeacherProvisioningJobs() {
  return useQuery({
    queryKey: queryKeys.teacherJobs,
    queryFn: adminData.listTeacherProvisioningJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data as TeacherProvisioningJobSummary[] | undefined
      const settled = jobs?.every((job) => job.status === "completed" || job.status === "failed")
      return settled ? false : 5000
    },
  })
}
