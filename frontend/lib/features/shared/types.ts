export interface LessonResource {
  type: "pdf" | "link" | "video" | string
  title: string
  url: string
  detail?: string
}

export interface LessonSubtopic {
  id: string
  title: string
  file: string
  type?: "markdown" | "simulator"
}

export interface TopicContentMeta {
  id: string
  number: number
  title: string
  description: string
  subtopics: LessonSubtopic[]
  resources: LessonResource[]
}

export interface RouteRule {
  path: string
  roles: string[]
  exact?: boolean
}
