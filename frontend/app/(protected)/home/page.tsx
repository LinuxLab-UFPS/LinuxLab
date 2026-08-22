import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/features/auth/session"
import { StudentDashboard } from "./_student-dashboard"
import { TeacherDashboard } from "./_teacher-dashboard"
import { NoGroupPage } from "@shared/pages/no-group"
import { listMyGroupActivities } from "@/lib/features/student/group-activities"

export default async function HomePage() {
  const session = await getServerSession()
  if (!session) redirect("/")

  switch (session.user.role) {
    case "student": {
      let hasGroup = true
      try {
        const data = await listMyGroupActivities()
        hasGroup = Boolean(data.group)
      } catch {}
      if (!hasGroup) return <NoGroupPage email={session.user.email} />
      return <StudentDashboard />
    }
    case "teacher":
      return <TeacherDashboard />
    case "admin":
      redirect("/admin/docentes")
    default:
      redirect("/")
  }
}
