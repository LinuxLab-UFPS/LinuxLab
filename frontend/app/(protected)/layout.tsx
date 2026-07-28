import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/features/auth/session"
import { StudentShell } from "@/components/student/student-shell"
import { TeacherShell } from "@/components/teacher/teacher-shell"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) redirect("/")

  switch (session.user.role) {
    case "student":
      return <StudentShell>{children}</StudentShell>
    case "teacher":
      return <TeacherShell>{children}</TeacherShell>
    case "admin":
      return <AdminShell>{children}</AdminShell>
  }
}
