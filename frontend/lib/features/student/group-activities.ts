import { apiFetch } from "@/lib/api/client"
import type {
  GroupActivityDetail,
  GroupCheckOutcome,
  MyGroupOverview,
} from "@/lib/models/activities"

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
