import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/features/auth/session"
import { StudentDashboard } from "./_student-dashboard"
import { TeacherDashboard } from "./_teacher-dashboard"

export default async function HomePage() {
  const session = await getServerSession()
  if (!session) redirect("/login")

  switch (session.user.role) {
    case "student": {
      if (session.user.hasEnrollment === false) redirect("/inscripcion/pendiente")
      return <StudentDashboard />
    }
    case "teacher":
      return <TeacherDashboard />
    case "admin":
      redirect("/admin/docentes")
    default:
      redirect("/login")
  }
}
