import { RoleGuard } from "@/components/shared/role-guard"
import { TerminalWorkspace } from "@/components/student/terminal-workspace"
import { getActivity } from "@/lib/features/shared/activities"
import { getActivityStatement } from "@/lib/features/shared/activity-content"

/**
 * The terminal, and the only place where an activity is solved: `?actividad=`
 * opens its statement beside the console. The statement is read on the server
 * because it lives on disk, not in the database.
 */
export default async function TerminalPage({
  searchParams,
}: {
  searchParams: Promise<{ actividad?: string }>
}) {
  const { actividad } = await searchParams
  const activity = actividad ? getActivity(actividad) : undefined
  const statement = activity ? getActivityStatement(activity.slug) : null

  return (
    <RoleGuard roles={["student", "teacher", "admin"]}>
      <TerminalWorkspace activity={activity ?? null} statement={statement} />
    </RoleGuard>
  )
}
