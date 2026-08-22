import { HomeHero } from "@/lib/features/student/components/home-hero"
import { TopicGrid } from "@/lib/features/student/components/topic-grid"
import { getTopicLessons, getTopicPreviews } from "@shared/lib/content/lessons"

/** Student landing: hero on top, the topic catalogue below. */
export function StudentDashboard() {
  return (
    <div className="min-h-full pb-24">
      <HomeHero />
      <section className="mx-auto max-w-7xl px-6">
        <TopicGrid topicLessons={getTopicLessons()} previews={getTopicPreviews()} />
      </section>
    </div>
  )
}
