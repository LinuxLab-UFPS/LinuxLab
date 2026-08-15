import type { Role } from "./auth"

export interface AuditEntry {
  id: number
  timestamp: string
  userName: string
  email: string
  role: Role
  group: string
  action: string
  /** Objeto sobre el que se actuó (actividad, tema...). Se resalta aparte. */
  target?: string
}
