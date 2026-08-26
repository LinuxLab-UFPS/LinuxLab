"use client"

import { syllabus } from "@shared/lib/content/temario"
import { topicIllustration } from "@/lib/features/student/components/topic-illustrations"
import { ContentCard } from "@/lib/features/student/components/content-card"
import { previewTags } from "@/lib/features/student/components/topic-tags"
import { useCourseProgress } from "@/lib/features/student/course-progress"
import type { TopicLessons, TopicPreview } from "@shared/lib/content/lessons"

interface TopicGridProps {
  topicLessons: Record<number, TopicLessons>
  previews: Record<number, TopicPreview>
}

/**
 * El catalogo de temas del panel, con el progreso de cada uno.
 *
 * Tres por fila, la misma reja que la portada publica: alli salen seis temas y
 * aqui los diez, pero la tarjeta mide igual en los dos sitios. Se probo con
 * cuatro y quedaban demasiado apretadas.
 */
export function TopicGrid({ topicLessons, previews }: TopicGridProps) {
  const { doneCount, lessonTotal } = useCourseProgress(topicLessons)

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {syllabus.map((topic) => {
        const total = lessonTotal(topic.number)
        const done = doneCount(topic.number)
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        const preview = previews[topic.number]
        return (
          <ContentCard
            key={topic.slug}
            href={`/curso?tema=${topic.slug}`}
            title={`${topic.number}. ${topic.title}`}
            description={topic.description}
            illustration={topicIllustration(topic.number)}
            tags={preview ? previewTags(preview) : []}
            progress={pct}
          />
        )
      })}
    </div>
  )
}
