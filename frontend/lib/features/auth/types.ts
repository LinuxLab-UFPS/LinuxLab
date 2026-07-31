export type Role = "admin" | "teacher" | "student"

export interface UserPreferences {
  terminalFontSize: number
  terminalFontFamily: string
  theme: string
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  googleId?: string
  active?: boolean
  linuxUsername?: string | null
  linuxProvisioned?: boolean
  preferences?: UserPreferences | null
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
