import { adminApi } from "./api"
import type { TeacherFilters } from "./api"
import type { TeacherListItem } from "./types"

export async function listTeachers(filters?: TeacherFilters): Promise<TeacherListItem[]> {
  return adminApi.listTeachers(filters)
}

export async function registerTeacher(input: {
  name: string
  email: string
}): Promise<TeacherListItem> {
  return adminApi.registerTeacher(input)
}

export async function toggleTeacherStatus(id: string): Promise<TeacherListItem> {
  return adminApi.toggleTeacherStatus(id)
}
