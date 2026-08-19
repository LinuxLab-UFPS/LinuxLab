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
