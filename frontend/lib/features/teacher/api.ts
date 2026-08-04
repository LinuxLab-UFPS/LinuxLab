import { apiFetch } from "@/lib/api/client"
import { env } from "@/lib/config/env"
import type {
  Group,
  CreateGroupInput,
  Activity,
  CreateActivityInput,
  AuditEntry,
  GroupProgressSummary,
  StudentGroupDetail,
  Enrollment,
  ProvisioningJobSummary,
} from "./types"
import type { EnrollmentStudent } from "@/lib/features/auth/types"

export interface CreateGroupResponse {
  group: Group
  enrollment: {
    total: number
    registered: number
    skipped: number
    errors: { row: number; email: string | null; error: string }[]
  }
}

export const teacherApi = {
  listGroups: () => apiFetch<Group[]>("/api/groups"),
  getGroup: (id: string) => apiFetch<Group>(`/api/groups/${id}`),
  createGroup: (input: CreateGroupInput) =>
    apiFetch<CreateGroupResponse>("/api/groups", { method: "POST", body: JSON.stringify(input) }),
  // PATCH /archive desactiva el grupo, archiva sus matriculas y encola el
  // teardown del entorno (usuarios Linux y carpeta). Responde 409 si ya lo
  // estaba. No hay forma de reactivar, por eso la UI no la ofrece.
  deactivateGroup: (id: string) =>
    apiFetch<void>(`/api/groups/${id}/archive`, { method: "PATCH" }),

  deleteGroup: (id: string) => apiFetch<void>(`/api/groups/${id}`, { method: "DELETE" }),

  listBankActivities: () => apiFetch<Activity[]>("/api/activities/bank"),
  listGroupActivities: (groupId: string) =>
    apiFetch<Activity[]>(`/api/groups/${groupId}/activities`),
  getActivity: (id: string) => apiFetch<Activity>(`/api/activities/${id}`),
  createActivity: (input: CreateActivityInput) =>
    apiFetch<Activity>("/api/activities", { method: "POST", body: JSON.stringify(input) }),
  submitActivity: (activityId: string) =>
    apiFetch<void>(`/api/activities/${activityId}/submit`, { method: "POST" }),
  validateActivity: (activityId: string) =>
    apiFetch<void>(`/api/activities/${activityId}/validate`, { method: "POST" }),

  listEnrollments: (groupId: string) =>
    apiFetch<Enrollment[]>(`/api/groups/${groupId}/enrollments`),
  addStudent: (groupId: string, input: Omit<EnrollmentStudent, "id">) =>
    apiFetch<EnrollmentStudent>(`/api/groups/${groupId}/students`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  importStudentsCsv: async (groupId: string, file: File) => {
    const text = await file.text()
    const res = await fetch(`${env.backendUrl}/api/groups/${groupId}/students/csv`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "text/plain" },
      body: text,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.json() as Promise<{
      total: number
      registered: number
      skipped: number
      errors: { row: number; email: string | null; error: string }[]
    }>
  },
  listStudents: (groupId: string) =>
    apiFetch<EnrollmentStudent[]>(`/api/groups/${groupId}/students`),
  listProvisioningJobs: (groupId: string) =>
    apiFetch<ProvisioningJobSummary[]>(`/api/groups/${groupId}/provisioning-jobs`),

  listAuditLog: () => apiFetch<AuditEntry[]>("/api/audit-log"),
  clearAuditLog: () => apiFetch<void>("/api/audit-log", { method: "DELETE" }),

  getGroupProgress: (groupId: string) =>
    apiFetch<GroupProgressSummary>(`/api/groups/${groupId}/progress`),
  getStudentGroupDetail: (groupId: string, studentId: string) =>
    apiFetch<StudentGroupDetail>(`/api/groups/${groupId}/students/${studentId}`),
  gradeSubmission: (submissionId: string, score: number, feedback?: string) =>
    apiFetch<void>(`/api/submissions/${submissionId}`, {
      method: "PATCH",
      body: JSON.stringify({ score, feedback }),
    }),
}
