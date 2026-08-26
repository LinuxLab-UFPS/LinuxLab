import { MyGroupView } from "@/lib/features/student/components/my-group-view"
import { getMyGrades, listMyGroupActivities } from "@/lib/features/student/group-activities"
import { requireServerRole } from "@/lib/features/auth/session"
import { EMPTY_MY_GRADES } from "@/lib/models/groups"

export default async function MyGroupPage() {
  await requireServerRole(["student"])
  const [{ group, activities }, grades] = await Promise.all([
    listMyGroupActivities().catch(() => ({ group: null, activities: [] })),
    getMyGrades().catch(() => EMPTY_MY_GRADES),
  ])

  return <MyGroupView group={group} activities={activities} grades={grades} />
}
