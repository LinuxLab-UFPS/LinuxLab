import { HomeHero } from "@/components/student/home-hero"
import { TopicGrid } from "@/components/student/topic-grid"
import { getTopicLessonCounts, getTopicPreviews } from "@/lib/features/shared/lessons"
import { LessonProgressProvider } from "@/lib/features/student/progress"

/** Student landing: hero on top, the topic catalogue below. */
export function StudentDashboard() {
  return (
    <div className="min-h-full pb-24">
      <HomeHero />
      <section className="mx-auto max-w-7xl px-6">
        <LessonProgressProvider>
          <TopicGrid
            lessonCounts={getTopicLessonCounts()}
            previews={getTopicPreviews()}
          />
        </LessonProgressProvider>
      </section>
    </div>
  )
}
