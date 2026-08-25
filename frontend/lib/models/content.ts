import type { Role } from "./auth"

export interface SubTopic {
  number: number
  title: string
}

export interface Topic {
  number: number
  slug: string
  title: string
  description: string
  complementary?: boolean
  subTopics: SubTopic[]
}

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

/** Regla de navegacion: que roles pueden ver una ruta. */
export interface RouteRule {
  path: string
  roles: Role[]
  exact?: boolean
  requiresEnrollment?: boolean
}
