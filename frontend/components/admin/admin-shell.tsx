import { AdminHeader } from "@/components/admin/admin-header"

/** Shell for the admin experience: a black top header instead of the left sidebar. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <AdminHeader />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
