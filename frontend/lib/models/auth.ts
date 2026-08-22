import type { UserPreferences } from "./preferences"

export type Role = "admin" | "teacher" | "student"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  code?: string | null
  googleId?: string
  active?: boolean
  linuxUsername?: string | null
  linuxProvisioned?: boolean
  hasEnrollment: boolean
  preferences?: UserPreferences | null
}

export interface Session {
  user: User
}

export interface EnrollmentStudent {
  id: string
  name: string
  email: string
  code: string
  /** "active" mientras el grupo corre; "archived" cuando se desactivo. */
  status?: string
  /** Cuenta del sistema creada al aprovisionar; null mientras no exista. */
  linuxUsername?: string | null
  /** Si esa cuenta ya existe dentro del entorno. */
  linuxProvisioned?: boolean
  /** Ultimo login en ISO. */
  lastLogin?: string | null
  /** Actividades completadas / total del grupo. */
  completedActivities?: number
  totalActivities?: number
}
