import type { Role, EnrollmentStudent } from "@/lib/features/auth/types"

export interface Group {
  id: string
  name: string
  description: string
  createdAt: string
  archived: boolean
  enabledTopics: number[]
  studentCount: number
  activityCount: number
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

export type ActivitySource = "bank" | "teacher"

export type Difficulty = "basic" | "intermediate" | "advanced"

export type EvaluationType = "atomic" | "manual"

export interface ActivityCheck {
  id: string
  type: string
  params: Record<string, string>
  points: number
}

export interface Activity {
  id: string
  title: string
  topicNumber: number
  source: ActivitySource
  difficulty?: Difficulty
  instructions: string
  maxScore: number
  dueDate?: string
  required: boolean
  evaluationType: EvaluationType
  checks: ActivityCheck[]
  uses?: number
}

export type CreateActivityInput = Omit<Activity, "id" | "uses">

export interface AuditEntry {
  id: number
  timestamp: string
  userName: string
  email: string
  role: Role
  group: string
  action: string
}

export type ProgressStatus = "completed" | "in-progress" | "not-started" | "overdue"

export interface StudentProgress {
  student: EnrollmentStudent
  topicStatus: Record<number, ProgressStatus>
  progress: number
  lastActivity: string
}

export interface GroupProgressSummary {
  enrolledCount: number
  averageProgress: number
  completedToday: number
  activeNow: number
  rows: StudentProgress[]
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
