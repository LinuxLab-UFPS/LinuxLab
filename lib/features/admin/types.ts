export interface TeacherListItem {
  id: string
  name: string
  email: string
  active: boolean
  linuxUsername?: string | null
  linuxProvisioned?: boolean
}
