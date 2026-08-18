import { apiFetch } from "@/lib/api/client"
import type {
  GroupActivityDetail,
  GroupCheckOutcome,
  MyGroupOverview,
} from "@/lib/models/activities"
import type { MyGrades } from "@/lib/models/groups"

export type {
  ActivityCheckResult as GroupCheckResult,
  GroupActivityDetail,
  GroupActivitySummary,
  GroupCheckOutcome,
  MyGroup,
  MyGroupOverview,
} from "@/lib/models/activities"

export async function listMyGroupActivities(): Promise<MyGroupOverview> {
  return apiFetch<MyGroupOverview>("/api/group-activities/mine")
}

export async function getGroupActivityDetail(id: string): Promise<GroupActivityDetail> {
  return apiFetch<GroupActivityDetail>(`/api/group-activities/${id}`)
}

export async function checkGroupActivity(id: string): Promise<GroupCheckOutcome> {
  return apiFetch<GroupCheckOutcome>(`/api/group-activities/${id}/check`, { method: "POST" })
}

export async function submitGroupActivity(id: string): Promise<{ id: string; status: string; submittedAt: string }> {
  return apiFetch(`/api/group-activities/${id}/submit`, { method: "POST" })
}

export async function getMyGrades(): Promise<MyGrades> {
  return apiFetch<MyGrades>("/api/group-activities/mine/grades")
}
