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
  activities: unknown[]
}
