import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/features/auth/session"
import { StudentShell } from "@/components/student/student-shell"
import { TeacherShell } from "@/components/teacher/teacher-shell"
import { Sidebar as AdminSidebar } from "@/components/admin/sidebar"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) redirect("/")

  // Student and teacher get the top-header shell; admin keeps the sidebar
  // until it gets redesigned too.
  if (session.user.role === "student") {
    return <StudentShell>{children}</StudentShell>
  }
  if (session.user.role === "teacher") {
    return <TeacherShell>{children}</TeacherShell>
  }

  // Only admin is left on the sidebar, until it gets its own header too.
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  )
}
