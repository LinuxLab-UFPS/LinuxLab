import { adminApi } from "./api"
import type { TeacherFilters } from "./api"
import type { TeacherListItem, TeacherProvisioningJobSummary, TeacherRequest } from "./types"

export async function listTeachers(filters?: TeacherFilters): Promise<TeacherListItem[]> {
  return adminApi.listTeachers(filters)
}

export async function registerTeacher(input: {
  name: string
  email: string
  code: string
}): Promise<TeacherListItem & { debugLink?: string }> {
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

export async function listTeacherRequests(): Promise<TeacherRequest[]> {
  return adminApi.listTeacherRequests()
}

export async function teacherRequestCount(): Promise<number> {
  return (await adminApi.teacherRequestCount()).pending
}

export async function approveTeacherRequest(id: string) {
  return adminApi.approveTeacherRequest(id)
}

export async function rejectTeacherRequest(id: string) {
  return adminApi.rejectTeacherRequest(id)
}
