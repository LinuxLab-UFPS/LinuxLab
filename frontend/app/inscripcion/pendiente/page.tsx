import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/features/auth/session"
import { NoGroupStandalone } from "@shared/pages/no-group"

export default async function NoGrupoPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")
  if (session.user.role !== "student" || session.user.hasEnrollment) redirect("/inicio")
  return <NoGroupStandalone email={session.user.email} />
}
