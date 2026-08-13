import { apiFetch } from "@/lib/api/client"

export interface MyGroup {
  id: string
  name: string
  description: string
  teacherName: string
}

export interface GroupActivitySummary {
  id: string
  title: string
  description: string
  topicNumber: number
  checksCount: number
  passed: boolean
  lastScore: number | null
}

export interface MyGroupOverview {
  group: MyGroup | null
  activities: GroupActivitySummary[]
}

export interface GroupActivityDetail {
  id: string
  title: string
  instructions: string
  workdir: string
  dueAt: string | null
  evaluationType: "atomic" | "manual"
  maxScore: number
  checksCount: number
  lastAttempt: { passed: boolean; score: number } | null
}

export interface GroupCheckResult {
  id: string
  type: string
  params: Record<string, string>
  points: number
  passed: boolean
  detail: string
}

export interface GroupCheckOutcome {
  passed: boolean
  score: number
  maxScore: number
  results: GroupCheckResult[]
}

export async function listMyGroupActivities(): Promise<MyGroupOverview> {
  return apiFetch<MyGroupOverview>("/api/group-activities/mine")
}

export async function getGroupActivityDetail(id: string): Promise<GroupActivityDetail> {
  return apiFetch<GroupActivityDetail>(`/api/group-activities/${id}`)
}

export async function checkGroupActivity(id: string): Promise<GroupCheckOutcome> {
  return apiFetch<GroupCheckOutcome>(`/api/group-activities/${id}/check`, { method: "POST" })
}
