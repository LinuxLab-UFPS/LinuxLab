import type { Role } from "./auth"

export interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  userName: string | null
  email: string | null
  role: Role | null
  eventType: string
  /** Etiqueta corta legible del tipo de evento (para la UI). */
  action: string
  /** Frase legible completa, redactada al momento del evento. */
  message: string
  target?: string | null
  groupId?: string | null
  groupName?: string | null
  metadata?: unknown
}
