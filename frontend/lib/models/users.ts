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
