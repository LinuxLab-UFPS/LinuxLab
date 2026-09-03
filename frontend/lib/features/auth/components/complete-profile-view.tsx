"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Loader2, LogOut } from "lucide-react"
import { useAuth } from "@/lib/features/auth/context"
import { apiFetch } from "@/lib/api/client"
import { notify } from "@shared/lib/toast"
import { RUTA_LOGIN } from "@shared/lib/next-url"
import type { User } from "@/lib/features/auth/types"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Button } from "@shared/components/ui/button"

/**
 * Puerta de cuenta: si un estudiante inició sesión (p.ej. por Gmail) sin haber
 * definido su código, esta es la única pantalla que ve hasta completarlo.
 *
 * Ya no es un modal sobre la aplicación: el layout la renderiza en solitario
 * cuando el `code` del JWT falta, así que nada más se monta antes de tiempo y
 * quien no quiera completar sus datos tiene a la vista el botón de cerrar
 * sesión, que antes no existía.
 *
 * El nombre viene prefijado con el de la cuenta de Google y se puede corregir:
 * el backend guarda ambos datos y re-emite la cookie de sesión, que es lo que
 * levanta esta puerta (el layout de servidor lee el `code` del JWT).
 */
export function CompleteProfileView({ defaultName }: { defaultName?: string | null }) {
  const { hydrate, signOut } = useAuth()
  const router = useRouter()
  const [name, setName] = useState(defaultName ?? "")
  const [code, setCode] = useState("")
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notify.error(null, "Ingresa tu nombre completo.")
      return
    }
    if (!code.trim()) {
      notify.error(null, "Ingresa tu código de estudiante.")
      return
    }
    setSaving(true)
    try {
      // La respuesta trae el usuario ya rehidratado (con código): la cookie
      // nueva va en la misma respuesta, así que con refrescar el layout el
      // servidor ve la sesión completa y libera la aplicación.
      const data = await apiFetch<{ user: User }>("/api/students/me/code", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      })
      hydrate(data.user)
      notify.success("Información guardada.")
      router.refresh()
    } catch (err) {
      notify.error(err, "No se pudo guardar la información.")
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      // Carga completa: el layout de servidor aún pinta esta pantalla con la
      // sesión vieja y una navegación de cliente no alcanza a limpiarla.
      window.location.href = RUTA_LOGIN
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-center text-2xl font-bold text-foreground">Completa tu información</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Necesitamos tu nombre y tu código de estudiante para identificarte en el curso.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="complete-name">Nombre completo</Label>
            <Input
              id="complete-name"
              autoComplete="name"
              value={name}
              placeholder="Tu nombre"
              onChange={(e) => setName(e.target.value)}
              className="h-11"
              disabled={saving || signingOut}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complete-code">Código de estudiante</Label>
            <Input
              id="complete-code"
              autoComplete="off"
              value={code}
              placeholder="1150000"
              onChange={(e) => setCode(e.target.value)}
              className="h-11"
              disabled={saving || signingOut}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={saving || signingOut} className="h-11 w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          disabled={saving || signingOut}
          className="mt-3 h-11 w-full"
        >
          {signingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Cerrando sesión…
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
