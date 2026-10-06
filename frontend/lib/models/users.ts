export interface TeacherListItem {
  id: string
  name: string
  email: string
  code: string | null
  active: boolean
  linuxUsername?: string | null
  linuxProvisioned?: boolean
  createdAt?: string
}

/** Solicitud de cuenta docente enviada desde /solicitud-docente. */
export interface TeacherRequest {
  id: string
  name: string
  email: string
  code: string
  department: string | null
  message: string | null
  status: "pending" | "approved" | "rejected"
  createdAt: string
  reviewedAt: string | null
}
