import { apiFetch } from "@/lib/api/client"
import { env } from "@/lib/config/env"
import type {
  Group,
  CreateGroupInput,
  Activity,
  ActivitySubmissionStudent,
  CreateActivityInput,
  AuditEntry,
  AuditFilters,
  AuditListResult,
  GroupProgressSummary,
  Gradebook,
  StudentPerformance,
  Enrollment,
  ProvisioningJobSummary,
  CatalogEntry,
  StudentActivityDetail,
  SubmissionDetail,
  SubmissionGrade,
  ManualSubmission,
  FinalizePreview,
  FinalizeResponse,
  GroupCertificates,
  AddStudentOutcome,
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

/** Resumen de aprovisionamiento del docente para el indicador global. */
export interface ProvisioningStatusSummary {
  pending: number
  completed: number
  failed: number
  total: number
}

export const teacherApi = {
  listGroups: () => apiFetch<Group[]>("/api/groups"),
  getGroup: (id: string) => apiFetch<Group>(`/api/groups/${id}`),
  createGroup: (input: CreateGroupInput) =>
    apiFetch<CreateGroupResponse>("/api/groups", { method: "POST", body: JSON.stringify(input) }),
  /** Actualiza nombre y descripción del grupo; el backend rechaza grupos no activos. */
  updateGroup: (id: string, input: { name: string; description?: string | null }) =>
    apiFetch<Group>(`/api/groups/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  /** Regenera el token de inscripción del grupo; el enlace anterior queda inválido. */
  rotateInvite: (id: string) =>
    apiFetch<{ inviteUrl: string }>(`/api/groups/${id}/invite/rotate`, { method: "POST" }),
  // PATCH /archive aparta del listado un curso ya finalizado; por
  // compatibilidad un curso activo sigue desactivandose (teardown del entorno).
  // Responde 409 si ya estaba archivado.
  deactivateGroup: (id: string) =>
    apiFetch<void>(`/api/groups/${id}/archive`, { method: "PATCH" }),
  /** Devuelve un grupo archivado al listado principal, como finalizado. */
  unarchiveGroup: (id: string) =>
    apiFetch<Group>(`/api/groups/${id}/unarchive`, { method: "POST" }),
  /** Vista previa de la finalización: progreso, definitiva y elegibilidad por estudiante. */
  getFinalizePreview: (id: string) =>
    apiFetch<FinalizePreview>(`/api/groups/${id}/finalize/preview`),
  /** Finaliza el curso: emite certificados, envía correos y destruye el entorno. */
  finalizeGroup: (id: string) =>
    apiFetch<FinalizeResponse>(`/api/groups/${id}/finalize`, { method: "POST" }),
  /** Certificados emitidos del grupo (estudiantes + instructor). */
  getGroupCertificates: (id: string) =>
    apiFetch<GroupCertificates>(`/api/groups/${id}/certificates`),

  deleteGroup: (id: string) => apiFetch<void>(`/api/groups/${id}`, { method: "DELETE" }),

  getCheckCatalog: () => apiFetch<CatalogEntry[]>("/api/activities/catalog"),
  listGroupActivities: (groupId: string) =>
    apiFetch<Activity[]>(`/api/groups/${groupId}/activities`),
  getGroupActivity: (groupId: string, activityId: string) =>
    apiFetch<Activity>(`/api/groups/${groupId}/activities/${activityId}`),
  createActivity: (groupId: string, input: CreateActivityInput) =>
    apiFetch<Activity>(`/api/groups/${groupId}/activities`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateActivity: (groupId: string, activityId: string, input: CreateActivityInput) =>
    apiFetch<Activity>(`/api/groups/${groupId}/activities/${activityId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  setActivityEnabled: (groupId: string, activityId: string, enabled: boolean) =>
    apiFetch<Activity>(
      `/api/groups/${groupId}/activities/${activityId}/${enabled ? "publish" : "disable"}`,
      { method: "POST" },
    ),
  extendActivityDueDate: (groupId: string, activityId: string, dueDate: string) =>
    apiFetch<Activity>(`/api/groups/${groupId}/activities/${activityId}/extend-due`, {
      method: "POST",
      body: JSON.stringify({ dueDate }),
    }),
  listActivitySubmissions: (groupId: string, activityId: string) =>
    apiFetch<ActivitySubmissionStudent[]>(
      `/api/groups/${groupId}/activities/${activityId}/submissions`,
    ),
  listManualSubmissions: (groupId: string, activityId: string) =>
    apiFetch<ManualSubmission[]>(
      `/api/groups/${groupId}/activities/${activityId}/manual-submissions`,
    ),
  getSubmission: (submissionId: string) =>
    apiFetch<SubmissionDetail>(`/api/submissions/${submissionId}`),
  getSubmissionFile: (submissionId: string, filePath: string) =>
    apiFetch<{ path: string; content: string }>(
      `/api/submissions/${submissionId}/files?path=${encodeURIComponent(filePath)}`,
    ),
  gradeSubmission: (submissionId: string, score: number, feedback?: string) =>
    apiFetch<SubmissionGrade>(`/api/submissions/${submissionId}/grade`, {
      method: "PATCH",
      body: JSON.stringify({ score, feedback }),
    }),
  getStudentActivityDetail: (groupId: string, activityId: string, studentId: string) =>
    apiFetch<StudentActivityDetail>(
      `/api/groups/${groupId}/activities/${activityId}/students/${studentId}`,
    ),
  submitActivity: (activityId: string) =>
    apiFetch<void>(`/api/activities/${activityId}/submit`, { method: "POST" }),
  validateActivity: (activityId: string) =>
    apiFetch<void>(`/api/activities/${activityId}/validate`, { method: "POST" }),

  listEnrollments: (groupId: string) =>
    apiFetch<Enrollment[]>(`/api/groups/${groupId}/enrollments`),
  addStudent: (groupId: string, input: Omit<EnrollmentStudent, "id">) =>
    apiFetch<AddStudentOutcome>(`/api/groups/${groupId}/students`, {
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
  getProvisioningStatus: () =>
    apiFetch<ProvisioningStatusSummary>("/api/groups/provisioning/status"),

  listAuditLog: (filters?: AuditFilters) => {
    const params = new URLSearchParams()
    if (filters?.eventType) params.set("eventType", filters.eventType)
    if (filters?.category) params.set("category", filters.category)
    if (filters?.groupId) params.set("groupId", filters.groupId)
    if (filters?.from) params.set("from", filters.from)
    if (filters?.to) params.set("to", filters.to)
    if (filters?.search) params.set("search", filters.search)
    if (filters?.page) params.set("page", String(filters.page))
    if (filters?.limit) params.set("limit", String(filters.limit))
    const qs = params.toString()
    return apiFetch<AuditListResult>(
      qs ? `/api/audit?${qs}` : `/api/audit`,
    )
  },

  listGroupAuditLog: (groupId: string, limit = 10) =>
    apiFetch<AuditEntry[]>(`/api/audit/grupos/${groupId}/recent?limit=${limit}`),

  getGroupProgress: (groupId: string) =>
    apiFetch<GroupProgressSummary>(`/api/groups/${groupId}/progress`),
  getGradebook: (groupId: string) => apiFetch<Gradebook>(`/api/groups/${groupId}/gradebook`),
  getStudentPerformance: (groupId: string, studentId: string) =>
    apiFetch<StudentPerformance>(`/api/groups/${groupId}/gradebook/students/${studentId}`),
}
