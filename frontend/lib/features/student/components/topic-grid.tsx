"use client"

import { Clock, Video, Terminal, ListChecks } from "lucide-react"
import { syllabus } from "@shared/lib/content/temario"
import { topicIllustration } from "@/lib/features/student/components/topic-illustrations"
import { ContentCard, type CardTag } from "@/lib/features/student/components/content-card"
import { useCourseProgress } from "@/lib/features/student/course-progress"
import type { TopicLessons, TopicPreview } from "@shared/lib/content/lessons"

interface TopicGridProps {
  topicLessons: Record<number, TopicLessons>
  previews: Record<number, TopicPreview>
}

/** The topic catalogue on the home, using the shared ContentCard (red accent). */
export function TopicGrid({ topicLessons, previews }: TopicGridProps) {
  const { doneCount, lessonTotal } = useCourseProgress(topicLessons)

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {syllabus.map((topic) => {
        const total = lessonTotal(topic.number)
        const done = doneCount(topic.number)
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        const preview = previews[topic.number]
        return (
          <ContentCard
            key={topic.slug}
            href={`/group?tema=${topic.slug}`}
            title={`${topic.number}. ${topic.title}`}
            description={topic.description}
            illustration={topicIllustration(topic.number)}
            tags={preview ? previewTags(preview) : []}
            progress={pct}
            accent="red"
          />
        )
      })}
    </div>
  )
}

/** Colored "sneak peek" chips. Reading time always shows; the rest only when
 *  the topic actually has that kind of content inside. */
function previewTags(preview: TopicPreview): CardTag[] {
  const tags: CardTag[] = []
  if (preview.minutes > 0) {
    tags.push({
      icon: Clock,
      label: `${preview.minutes} min`,
      tone: "muted" as const,
    })
  }
  if (preview.videos > 0) {
    tags.push({
      icon: Video,
      label: `${preview.videos} ${preview.videos === 1 ? "video" : "videos"}`,
      tone: "sky" as const,
    })
  }
  if (preview.simulators > 0) {
    tags.push({
      icon: Terminal,
      label: `${preview.simulators} ${preview.simulators === 1 ? "simulador" : "simuladores"}`,
      tone: "emerald" as const,
    })
  }
  if (preview.activities > 0) {
    tags.push({
      icon: ListChecks,
      label: `${preview.activities} ${preview.activities === 1 ? "actividad" : "actividades"}`,
      tone: "amber" as const,
    })
  }
  return tags
}
