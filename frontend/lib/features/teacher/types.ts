export type {
  Activity,
  ActivityCheck,
  ActivitySource,
  ActivitySubmissionStudent,
  ActivityType,
  CatalogEntry,
  CatalogField,
  CreateActivityInput,
  Difficulty,
  EvaluationType,
  ManualSubmission,
  StudentActivityDetail,
  SubmissionDetail,
  SubmissionGrade,
} from "@/lib/models/activities"
import type { AuditEntry } from "@/lib/models/audit"
export { type AuditEntry }
export type {
  CreateGroupInput,
  Enrollment,
  Grade,
  Gradebook,
  GradebookActivity,
  GradebookCell,
  GradebookCellStatus,
  GradeSeriesPoint,
  GradeStatus,
  GradeSummary,
  GradeTopicSummary,
  Group,
  GroupProgressSummary,
  ProgressStatus,
  StudentGroupDetail,
  StudentPerformance,
  StudentProgress,
  TopicProgress,
  FinalizeStudentRow,
  FinalizePreview,
  FinalizeResponse,
  CertificateItem,
  InstructorCertificateItem,
  GroupCertificates,
} from "@/lib/models/groups"
export type {
  ProvisioningJobSummary,
  ProvisioningStatus,
} from "@/lib/models/provisioning"
export type { EnrollmentStudent } from "@/lib/models/auth"

export interface AuditFilters {
  eventType?: string
  category?: string
  groupId?: string
  from?: string
  to?: string
  search?: string
  page?: number
  limit?: number
}

export interface AuditListResult {
  entries: AuditEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Lo que responde el alta de un estudiante en un grupo.
 *
 * No es el estudiante a secas: viene envuelto, porque el alta puede terminar
 * sin matricular (`enrolled: false` cuando ya estaba en ese mismo grupo) y eso
 * llega como 200, no como error.
 */
export interface AddStudentOutcome {
  enrolled: boolean
  reason?: string
  student: import("@/lib/models/auth").EnrollmentStudent
  linuxProvisioned: boolean
}
