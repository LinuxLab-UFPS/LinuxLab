import Link from "next/link"
import { ShieldX } from "lucide-react"

/** Página de acceso denegado estándar: fuera del shell, centrada, con tokens. */
export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-destructive/10">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Acceso no autorizado</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No tienes permiso para entrar a esta sección. Si crees que es un
          error, contacta al administrador.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block h-11 rounded-md bg-primary px-6 text-sm font-medium leading-[44px] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
