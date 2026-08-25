"use client"

import { useSearchParams } from "next/navigation"
import { ActivityCard } from "@/lib/features/student/components/activity-card"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import { getActivity } from "@shared/lib/content/activities"

/**
 * A topic advertising one of its activities. The lesson only shows the card —
 * clicking it leaves the course and opens the activity next to the terminal,
 * which is the only place activities are solved.
 */
export function LessonActivity({ slug }: { slug: string }) {
  const { passed, scores } = usePassedActivities()
  const params = useSearchParams()
  const activity = getActivity(slug)
  if (!activity) return null

  // El origen viaja en la URL: con él la actividad sabe a qué lección devolver
  // al estudiante y cuál es el tema que sigue.
  const tema = params.get("tema")
  const sub = params.get("sub")
  const href = tema
    ? `${activity.href}&tema=${tema}${sub ? `&sub=${sub}` : ""}`
    : activity.href

  return (
    <div className="my-10 max-w-md">
      <h2 className="mb-4 text-left text-2xl font-bold text-foreground">
        Ponlo en práctica con una{" "}
        <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text font-extrabold text-transparent">
          Actividad
        </span>
      </h2>
      <ActivityCard
        activity={{ ...activity, href }}
        completed={passed.has(activity.slug)}
        score={scores[activity.slug] ?? null}
      />
    </div>
  )
}
