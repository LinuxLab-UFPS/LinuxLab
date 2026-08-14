export type ProvisioningStatus = "pending" | "processing" | "completed" | "failed"

/** Job de aprovisionamiento de un estudiante (vista por grupo del docente). */
export interface ProvisioningJobSummary {
  id: string
  username: string | null
  status: ProvisioningStatus
  retries: number
  error: string | null
  student: { name: string; email: string; code: string | null }
  createdAt: string
}

/** Job de aprovisionamiento de un docente (vista de admin). */
export interface TeacherProvisioningJobSummary {
  id: string
  username: string | null
  status: ProvisioningStatus
  retries: number
  error: string | null
  teacher: { name: string; email: string }
  createdAt: string
}
