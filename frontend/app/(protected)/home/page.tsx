import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/features/auth/session"
import { StudentDashboard } from "./_student-dashboard"
import { TeacherDashboard } from "./_teacher-dashboard"
import { AdminDashboard } from "./_admin-dashboard"

export default async function HomePage() {
  const session = await getServerSession()
  if (!session) redirect("/")

  switch (session.user.role) {
    case "student":
      return <StudentDashboard />
    case "teacher":
      return <TeacherDashboard />
    case "admin":
      return <AdminDashboard />
    default:
      redirect("/")
  }
}
