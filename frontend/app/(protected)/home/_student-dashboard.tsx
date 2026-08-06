import { HomeHero } from "@/components/student/home-hero"
import { TopicGrid } from "@/components/student/topic-grid"
import { getTopicLessons, getTopicPreviews } from "@/lib/features/shared/lessons"

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
