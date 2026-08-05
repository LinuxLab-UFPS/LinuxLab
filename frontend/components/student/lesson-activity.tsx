"use client"

import { ActivityCard } from "@/components/student/activity-card"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import { getActivity } from "@/lib/features/shared/activities"

/**
 * A topic advertising one of its activities. The lesson only shows the card —
 * clicking it leaves the course and opens the activity next to the terminal,
 * which is the only place activities are solved.
 */
export function LessonActivity({ slug }: { slug: string }) {
  const { passed } = usePassedActivities()
  const activity = getActivity(slug)
  if (!activity) return null

  return (
    <div className="my-10 max-w-md">
      <h2 className="mb-4 text-left text-2xl font-bold text-foreground">
        Ponlo en práctica con una{" "}
        <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text font-extrabold text-transparent">
          Actividad
        </span>
      </h2>
      <ActivityCard activity={activity} completed={passed.has(activity.slug)} />
    </div>
  )
}
