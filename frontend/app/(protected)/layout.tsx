import { redirect } from "next/navigation"
import { RUTA_LOGIN } from "@shared/lib/next-url"
import { getServerSession } from "@/lib/features/auth/session"
import { Shell } from "@shared/pages/shell"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) redirect(RUTA_LOGIN)

  return <Shell role={session.user.role}>{children}</Shell>
}
