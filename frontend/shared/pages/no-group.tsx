"use client"

import { useRouter } from "next/navigation"
import { Users, LogOut } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { useAuth } from "@/lib/features/auth/context"

function NoGroupCard({ email }: { email?: string | null }) {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.replace("/login")
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 text-center shadow-xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-amber-500/10">
        <Users className="h-8 w-8 text-amber-600" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Aún no estás en ningún grupo</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Tu cuenta está activa, pero todavía no perteneces a ningún grupo de laboratorio. Cuando tu docente te matricule, aquí verás tus contenidos, actividades y calificaciones.
      </p>
      {email ? <p className="mt-3 text-xs text-muted-foreground">{email}</p> : null}
      <p className="mt-4 text-xs text-muted-foreground">Si crees que es un error, contacta a tu docente o al administrador.</p>
      <Button onClick={handleSignOut} className="mt-8 h-11 w-full gap-2">
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </Button>
    </div>
  )
}

export function NoGroupPage({ email }: { email?: string | null }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <NoGroupCard email={email} />
    </div>
  )
}

export function NoGroupStandalone({ email }: { email?: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <NoGroupCard email={email} />
    </div>
  )
}
