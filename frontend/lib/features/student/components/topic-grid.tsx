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

/** The topic catalogue on the home, using the shared ContentCard. */
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
            meta={preview ? previewMeta(preview) : []}
            progress={pct}
          />
        )
      })}
    </div>
  )
}

/** Lo que el tema trae dentro, en una sola fila. El orden lo fija lo que el
 *  estudiante decide con ello: primero cuanto cuesta leerlo, y detras lo que hay
 *  para hacer —actividades, simuladores— y por ultimo lo que hay para ver.
 *
 *  Los tres del mismo rojo. Antes cada uno tenia su color —azul los videos,
 *  verde los simuladores, ambar las actividades— y no significaban nada: son
 *  cuentas del mismo tema, y el icono ya dice de que es cada una. El tiempo se
 *  queda gris porque no es contenido, es una medida. */
function previewTags(preview: TopicPreview): CardTag[] {
  const tags: CardTag[] = []
  if (preview.activities > 0) {
    tags.push({
      icon: ListChecks,
      label: `${preview.activities} ${preview.activities === 1 ? "actividad" : "actividades"}`,
      tone: "primary" as const,
    })
  }
  if (preview.simulators > 0) {
    tags.push({
      icon: Terminal,
      label: `${preview.simulators} ${preview.simulators === 1 ? "simulador" : "simuladores"}`,
      tone: "primary" as const,
    })
  }
  if (preview.videos > 0) {
    tags.push({
      icon: Video,
      label: `${preview.videos} ${preview.videos === 1 ? "video" : "videos"}`,
      tone: "primary" as const,
    })
  }
  return tags
}

/** La duracion, en su propia fila encima del contenido: no es una cosa mas que
 *  el tema trae, es cuanto cuesta leerlo. Por eso va en gris y aparte. */
function previewMeta(preview: TopicPreview): CardTag[] {
  if (preview.minutes <= 0) return []
  return [{ icon: Clock, label: `${preview.minutes} min`, tone: "muted" as const }]
}
