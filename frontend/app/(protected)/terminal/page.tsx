import { RoleGuard } from "@/components/shared/role-guard"
import { TerminalWorkspace } from "@/components/student/terminal-workspace"
import { getActivity } from "@/lib/features/shared/activities"
import { getActivityStatement } from "@/lib/features/shared/activity-content"
import { getLessonNeighbours } from "@/lib/features/shared/lessons"
import { syllabus } from "@/lib/features/shared/temario"

/**
 * The terminal, and the only place where an activity is solved: `?actividad=`
 * opens its statement beside the console. The statement is read on the server
 * because it lives on disk, not in the database.
 *
 * `?tema=`/`?sub=` say which lesson sent the student here, so the panel can send
 * him back to exactly where he left and offer the next topic once he is done.
 */
export default async function TerminalPage({
  searchParams,
}: {
  searchParams: Promise<{ actividad?: string; tema?: string; sub?: string }>
}) {
  const { actividad, tema, sub } = await searchParams
  const activity = actividad ? getActivity(actividad) : undefined
  const statement = activity ? getActivityStatement(activity.slug) : null

  const topic = tema ? syllabus.find((t) => t.slug === tema) : undefined
  const origin = topic ? `/group?tema=${topic.slug}${sub ? `&sub=${sub}` : ""}` : undefined
  const next = topic ? getLessonNeighbours(topic.number, sub ?? null).next : null

  return (
    <RoleGuard roles={["student", "teacher", "admin"]}>
      <TerminalWorkspace
        activity={activity ?? null}
        statement={statement}
        origin={origin}
        next={next}
      />
    </RoleGuard>
  )
}
