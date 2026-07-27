import { TeacherHeader } from "@/components/teacher/teacher-header"

/** Shell for the teacher experience: a black top header instead of the left sidebar. */
export function TeacherShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TeacherHeader />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
