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

/* ---------------------------------------------------------------- *
 * Cuaderno de calificaciones (gradebook)
 * ---------------------------------------------------------------- */

export type GradebookCellStatus =
  | "completed"
  | "under-review"
  | "overdue"
  | "not-started"

export interface GradebookActivity {
  id: string
  activityNumber: number
  /** Código del directorio de trabajo (ej. T-0001, Q-0001): identifica la columna. */
  workdir: string
  title: string
  topicNumber: number | null
  evaluationType: "manual" | "automatic"
  activityType: "workshop" | "quiz"
  dueAt: string | null
  enabled: boolean
  gradingPolicy: "best_score" | "latest_score"
  maxScore: number
}

export interface GradebookCell {
  score: number | null
  status: GradebookCellStatus
  attempts: number
  lastDate: string | null
}

export interface Gradebook {
  students: { id: string; name: string; code: string | null }[]
  activities: GradebookActivity[]
  cells: Record<string, Record<string, GradebookCell>>
  activityAverages: Record<string, number | null>
  studentAverages: Record<string, number | null>
}

export interface GradeSeriesPoint {
  activityId: string
  activityNumber: number
  /** Código del directorio de trabajo (ej. T-0001): etiqueta corta en gráficas. */
  workdir: string
  title: string
  topicNumber: number
  evaluationType: "manual" | "automatic"
  activityType: "workshop" | "quiz"
  score: number | null
  status: GradebookCellStatus
  attempts: number
  lastDate: string | null
  dueAt: string | null
  groupAverage: number | null
}

export interface GradeTopicSummary {
  topicNumber: number
  completed: number
  total: number
  avgScore: number | null
}

export interface GradeSummary {
  average: number | null
  completed: number
  underReview: number
  overdue: number
  notStarted: number
  total: number
}

export interface StudentPerformance {
  student: EnrollmentStudent
  series: GradeSeriesPoint[]
  topics: GradeTopicSummary[]
  summary: GradeSummary
}

export interface MyGrades {
  group: { id: string; name: string } | null
  series: GradeSeriesPoint[]
  topics: GradeTopicSummary[]
  summary: GradeSummary
}

export const EMPTY_GRADE_SUMMARY: GradeSummary = {
  average: null,
  completed: 0,
  underReview: 0,
  overdue: 0,
  notStarted: 0,
  total: 0,
}

export const EMPTY_MY_GRADES: MyGrades = {
  group: null,
  series: [],
  topics: [],
  summary: EMPTY_GRADE_SUMMARY,
}
