import type { GroupActivitySummary } from "@/lib/models/activities"

export interface TopicProgressDTO {
  topicId: string
  topicNumber: number
  title: string
  completed: boolean
  completedAt: string | null
}

export interface ProgressResponse {
  topicProgress: TopicProgressDTO[]
  readKeys: string[]
  group: { id: string; name: string } | null
  /** Las actividades que el docente publicó en el grupo del estudiante. */
  activities: GroupActivitySummary[]
}
