import Link from "next/link"
import { Users } from "lucide-react"

export function NoGroupPage({ email }: { email?: string | null }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
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
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            onClick={() => window.location.reload()}
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Recargar
          </Link>
        </div>
      </div>
    </div>
  )
}

export function NoGroupStandalone({ email }: { email?: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-amber-500/10">
          <Users className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Aún no estás en ningún grupo</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tu cuenta está activa, pero todavía no perteneces a ningún grupo de laboratorio. Cuando tu docente te matricule, aquí verás tus contenidos, actividades y calificaciones.
        </p>
        {email ? <p className="mt-3 text-xs text-muted-foreground">{email}</p> : null}
        <Link
          href="/home"
          className="mt-8 inline-block h-11 rounded-md bg-primary px-6 text-sm font-medium leading-[44px] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
