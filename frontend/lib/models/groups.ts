import type { EnrollmentStudent } from "./auth"
import type { ActivitySource } from "./activities"

export interface Group {
  id: string
  name: string
  description: string
  createdAt: string
  archived: boolean
  enabledTopics: number[]
  studentCount: number
  activityCount: number
  /** Directorio del grupo dentro del home del docente: grupos/<group_dir>. */
  groupDir?: string
  activeNow: number
  averageScore: number | null
}

export interface Enrollment {
  id: string
  groupId: string
  student: EnrollmentStudent
  enrolledAt: string
}

export type CreateGroupInput = {
  name: string
  description: string
  students: { name: string; email: string; code: string }[]
}

export type ProgressStatus = "completed" | "in-progress" | "not-started" | "overdue"

export interface StudentProgress {
  student: EnrollmentStudent
  topicStatus: Record<number, ProgressStatus>
  progress: number
  lastActivity: string
  /** Actividades entregadas sobre las habilitadas en el curso. */
  activitiesDone?: number
  activitiesTotal?: number
  /** Promedio de puntuación de las entregas, en escala 0-5. */
  averageScore?: number
}

export interface GroupProgressSummary {
  enrolledCount: number
  averageProgress: number
  completedToday: number
  activeNow: number
  rows: StudentProgress[]
}

/** Progreso sin datos: lo usan las pantallas que dependen de endpoints aun no implementados. */
export const EMPTY_PROGRESS: GroupProgressSummary = {
  enrolledCount: 0,
  averageProgress: 0,
  completedToday: 0,
  activeNow: 0,
  rows: [],
}

export interface TopicProgress {
  topicNumber: number
  title: string
  completed: number
  total: number
  avgScore: number
}

export type GradeStatus = "completed" | "pending" | "not-started"

export interface Grade {
  id: string
  activityName: string
  topicTitle: string
  source: ActivitySource
  score: number | null
  maxScore: number
  status: GradeStatus
  date?: string
  evaluation?: "auto" | "manual"
}

export interface StudentGroupDetail {
  student: EnrollmentStudent
  groupName: string
  enrolledAt: string
  lastActive: string
  overallProgress: number
  topicProgress: TopicProgress[]
  recentGrades: Grade[]
  grades: Grade[]
}
