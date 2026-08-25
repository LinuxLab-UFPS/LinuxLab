import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/features/auth/session"
import { Shell } from "@shared/pages/shell"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) redirect("/login")

  return <Shell role={session.user.role}>{children}</Shell>
}
