import { RoleGuard } from "@shared/components/role-guard"
import { TerminalWorkspace } from "@/lib/features/student/components/terminal-workspace"
import { getActivity } from "@shared/lib/content/activities"
import { getActivityStatement } from "@shared/lib/content/activity-content"
import { getGroupActivityDetail } from "@/lib/features/student/group-activities"
import { getLessonNeighbours } from "@shared/lib/content/lessons"
import { syllabus } from "@shared/lib/content/temario"

/**
 * The terminal, and the only place where an activity is solved: `?actividad=`
 * opens a temario activity (statement on disk) and `?ga=` a course activity
 * (statement in the database). Both sit beside the console.
 *
 * `?tema=`/`?sub=` say which lesson sent the student here, so the panel can send
 * him back to exactly where he left and offer the next topic once he is done.
 */
export default async function TerminalPage({
  searchParams,
}: {
  searchParams: Promise<{ actividad?: string; tema?: string; sub?: string; ga?: string }>
}) {
  const { actividad, tema, sub, ga } = await searchParams
  const activity = actividad ? getActivity(actividad) : undefined
  const statement = activity ? getActivityStatement(activity.slug) : null
  const groupActivity = ga ? await getGroupActivityDetail(ga).catch(() => null) : null

  const topic = tema ? syllabus.find((t) => t.slug === tema) : undefined
  const origin = topic ? `/group?tema=${topic.slug}${sub ? `&sub=${sub}` : ""}` : undefined
  const next = topic ? getLessonNeighbours(topic.number, sub ?? null).next : null

  return (
    <RoleGuard roles={["student", "teacher", "admin"]}>
      <TerminalWorkspace
        activity={activity ?? null}
        statement={statement}
        groupActivity={groupActivity}
        origin={origin}
        next={next}
      />
    </RoleGuard>
  )
}
