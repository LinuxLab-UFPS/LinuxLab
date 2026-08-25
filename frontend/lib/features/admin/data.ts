import { adminApi } from "./api"
import type { TeacherFilters } from "./api"
import type { TeacherListItem, TeacherProvisioningJobSummary } from "./types"

export async function listTeachers(filters?: TeacherFilters): Promise<TeacherListItem[]> {
  return adminApi.listTeachers(filters)
}

export async function registerTeacher(input: {
  name: string
  email: string
  code: string
}): Promise<TeacherListItem> {
  return adminApi.registerTeacher(input)
}

export async function toggleTeacherStatus(id: string): Promise<TeacherListItem> {
  return adminApi.toggleTeacherStatus(id)
}

export async function listTeacherProvisioningJobs(): Promise<TeacherProvisioningJobSummary[]> {
  try {
    return await adminApi.listTeacherProvisioningJobs()
  } catch {
    return []
  }
}
