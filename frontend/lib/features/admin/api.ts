import { apiFetch } from "@/lib/api/client"
import type { TeacherListItem } from "./types"

export interface TeacherFilters {
  search?: string
  status?: string
}

function buildQuery(filters?: TeacherFilters): string {
  if (!filters) return ""
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.status && filters.status !== "all") params.set("status", filters.status)
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export const adminApi = {
  listTeachers: (filters?: TeacherFilters) =>
    apiFetch<TeacherListItem[]>(`/api/admin/docentes${buildQuery(filters)}`),

  registerTeacher: (input: { name: string; email: string }) =>
    apiFetch<TeacherListItem>("/api/admin/docentes", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  toggleTeacherStatus: (id: string) =>
    apiFetch<TeacherListItem>(`/api/admin/docentes/${id}`, {
      method: "PATCH",
    }),
}
