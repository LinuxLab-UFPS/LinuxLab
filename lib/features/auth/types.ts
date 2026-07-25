export type Role = "admin" | "teacher" | "student"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  googleId?: string
  active?: boolean
  linuxUsername?: string | null
  linuxProvisioned?: boolean
}

export interface EnrollmentStudent {
  id: string
  name: string
  email: string
  code: string
}

export interface Session {
  user: User
}
