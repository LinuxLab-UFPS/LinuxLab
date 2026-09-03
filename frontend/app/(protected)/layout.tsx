import { redirect } from "next/navigation"
import { RUTA_LOGIN } from "@shared/lib/next-url"
import { getServerSession } from "@/lib/features/auth/session"
import { Shell } from "@shared/pages/shell"
import { CompleteProfileView } from "@/lib/features/auth/components/complete-profile-view"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) redirect(RUTA_LOGIN)

  /* Puerta de cuenta: el estudiante que entró por Gmail y aún no registra su
     código solo ve el formulario de "Completar información". Se resuelve aquí
     y no con un modal encima de la aplicación para que nada más se monte
     antes de tiempo (antes un clic apresurado alcanzaba a lanzar peticiones
     contra un perfil a medias) y para que quien no quiera completar ahora
     tenga a la mano cerrar sesión. El `code` viaja en el JWT: se levanta sola
     cuando el backend re-firma la sesión tras guardar. */
  if (session.user.role === "student" && !session.user.code) {
    return <CompleteProfileView defaultName={session.user.name} />
  }

  return (
    <Shell role={session.user.role}>
      {children}
    </Shell>
  )
}
