import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/features/auth/session"
import { NoGroupStandalone } from "@shared/pages/no-group"
import { CompleteProfileView } from "@/lib/features/auth/components/complete-profile-view"

export default async function NoGrupoPage() {
  const session = await getServerSession()
  if (!session) redirect("/login")
  if (session.user.role !== "student" || session.user.hasEnrollment) redirect("/inicio")
  // Misma puerta que el layout protegido: sin código no se muestra nada más,
  // ni siquiera esta pantalla de espera de matrícula.
  if (!session.user.code) return <CompleteProfileView defaultName={session.user.name} />
  return <NoGroupStandalone email={session.user.email} />
}
