import { BookOpen, ListChecks } from "lucide-react"
import { ContentCard } from "@/components/student/content-card"
import { ActivityChecklistIllustration } from "@/components/student/topic-illustrations"
import type { Activity } from "@/lib/features/shared/activities"

/** An activity as an amber ContentCard: its topic and how many assertions the
 *  laboratory checks when the student presses the button. */
export function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <ContentCard
      href={activity.href}
      title={activity.title}
      description={activity.description}
      illustration={ActivityChecklistIllustration}
      tags={[
        {
          icon: BookOpen,
          label: activity.topicTitle,
          className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        },
        {
          icon: ListChecks,
          label: `${activity.checks} comprobaciones`,
          className: "bg-foreground/5 text-muted-foreground",
        },
      ]}
      accent="amber"
    />
  )
}
