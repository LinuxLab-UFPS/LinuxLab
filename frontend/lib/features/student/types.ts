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
