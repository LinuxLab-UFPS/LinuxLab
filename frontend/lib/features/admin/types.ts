import type { ProvisioningStatus } from "@/lib/features/teacher/types"

export interface TeacherListItem {
  id: string
  name: string
  email: string
  active: boolean
  linuxUsername?: string | null
  linuxProvisioned?: boolean
  createdAt?: string
}

export interface TeacherProvisioningJobSummary {
  id: string
  username: string | null
  status: ProvisioningStatus
  retries: number
  error: string | null
  teacher: { name: string; email: string }
  createdAt: string
}
