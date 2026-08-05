"use client"

import { ActivityCard } from "@/components/student/activity-card"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import type { Activity } from "@/lib/features/shared/activities"

/** The catalog grid: four per row, each card knowing whether it is done. */
export function ActivityGrid({ activities }: { activities: Activity[] }) {
  const { passed } = usePassedActivities()

  if (activities.length === 0) {
    return <p className="text-muted-foreground">Aún no hay actividades disponibles.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.slug}
          activity={activity}
          completed={passed.has(activity.slug)}
        />
      ))}
    </div>
  )
}
