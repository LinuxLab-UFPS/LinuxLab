import { HomeHero } from "@/lib/features/student/components/home-hero"
import { PlatformShowcase } from "@/lib/features/student/components/platform-showcase"
import { TopicGrid } from "@/lib/features/student/components/topic-grid"
import { getTopicLessons, getTopicPreviews } from "@shared/lib/content/lessons"

/** Student landing: hero, the platform tour, and the topic catalogue below. */
export function StudentDashboard() {
  return (
    <div className="min-h-full pb-24">
      <HomeHero />
      <PlatformShowcase />
      <section className="mx-auto max-w-7xl px-6">
        <TopicGrid topicLessons={getTopicLessons()} previews={getTopicPreviews()} />
      </section>
    </div>
  )
}
