"use client"

import { Clock, Video, Terminal, ListChecks } from "lucide-react"
import { syllabus } from "@/lib/features/shared/temario"
import { topicIllustration } from "@/components/student/topic-illustrations"
import { ContentCard, type CardTag } from "@/components/student/content-card"
import { useCourseProgress } from "@/lib/features/student/course-progress"
import type { TopicLessons, TopicPreview } from "@/lib/features/shared/lessons"

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
      className: "bg-secondary text-muted-foreground",
    })
  }
  if (preview.videos > 0) {
    tags.push({
      icon: Video,
      label: `${preview.videos} ${preview.videos === 1 ? "video" : "videos"}`,
      className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    })
  }
  if (preview.simulators > 0) {
    tags.push({
      icon: Terminal,
      label: `${preview.simulators} ${preview.simulators === 1 ? "simulador" : "simuladores"}`,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    })
  }
  if (preview.activities > 0) {
    tags.push({
      icon: ListChecks,
      label: `${preview.activities} ${preview.activities === 1 ? "actividad" : "actividades"}`,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    })
  }
  return tags
}
