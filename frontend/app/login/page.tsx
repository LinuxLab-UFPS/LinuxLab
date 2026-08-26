"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/features/auth/context"
import { notify } from "@shared/lib/toast"
import { destinoSeguro } from "@shared/lib/next-url"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Button } from "@shared/components/ui/button"
import { ForgotPasswordDialog } from "@shared/components/forgot-password-dialog"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const router = useRouter()
  const [signingIn, setSigningIn] = useState(false)
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    // El admin no tiene curso al que volver: su sitio es siempre el panel. Para
    // el resto manda el destino que venia en `?next=`, ya validado.
    //
    // La validacion la hace `destinoSeguro` y no un `startsWith("/")` a secas:
    // `//otro.sitio` tambien empieza por barra, y el navegador lo lee como otro
    // dominio, asi que colaba una salida fuera del sitio justo despues de que
    // alguien acabara de confiar sus credenciales a esta pantalla.
    if (user.role === "admin") {
      router.replace("/admin/docentes")
      return
    }
    const next =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null
    router.replace(destinoSeguro(next))
  }, [user, router])

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      const code = err instanceof Error ? (err as unknown as Record<string, unknown>).code : undefined
      if (err instanceof Error && err.message === "__silent__") return
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return
      notify.error(err, "No se pudo iniciar sesión.")
    } finally {
      setSigningIn(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(window.location.search)
    const next = params.get("next")
    const trimmedEmail = email.trim()
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      notify.error(null, "Ingresa un correo válido.")
      return
    }
    if (password.length < 6) {
      notify.error(null, "La contraseña debe tener al menos 6 caracteres.")
      return
    }
    if (mode === "signup" && !name.trim()) {
      notify.error(null, "Ingresa tu nombre completo.")
      return
    }
    if (mode === "signup" && !code.trim()) {
      notify.error(null, "Ingresa tu código de estudiante.")
      return
    }
    setSubmitting(true)
    try {
      if (mode === "login") {
        await signInWithEmail(trimmedEmail, password)
      } else {
        await signUpWithEmail(trimmedEmail, password, name.trim(), code.trim(), next ?? undefined)
        try {
          sessionStorage.setItem("pendingVerifyEmail", trimmedEmail)
        } catch {}
        router.push(next ? `/auth/verificacion?next=${encodeURIComponent(next)}` : "/auth/verificacion")
        notify.success("Cuenta creada. Verifica tu correo para continuar.")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo completar la operación."
      if (msg.includes("verificar tu correo")) {
        try {
          sessionStorage.setItem("pendingVerifyEmail", trimmedEmail)
        } catch {}
        notify.error(err, msg)
        router.push(next ? `/auth/verificacion?next=${encodeURIComponent(next)}` : "/auth/verificacion")
      } else {
        notify.error(err, msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const busy = loading || submitting
  const googleBusy = signingIn

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 shadow-xl">
        <Image src="/icon.svg" alt="" width={64} height={64} priority className="mx-auto mb-6 h-16 w-16" />
        <h1 className="text-center text-2xl font-bold text-foreground">Linux Lab UFPS</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Laboratorio Virtual de Linux para Sistemas Operativos</p>

        <form onSubmit={handleEmailSubmit} className="mt-8 space-y-4">
          {mode === "signup" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código de estudiante</Label>
                <Input
                  id="code"
                  autoComplete="off"
                  placeholder="Ej. 202310123"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11"
                  disabled={busy}
                />
              </div>
            </>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@ufps.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              ) : null}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pr-10"
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={busy} className="h-11 w-full">
            {submitting ? (mode === "login" ? "Iniciando…" : "Creando…") : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">o</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-6">
          <button
            type="button"
            disabled={googleBusy}
            onClick={handleGoogleSignIn}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-input bg-background font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleBusy ? "Iniciando sesión…" : "Continuar con Google"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => setMode("login")} className="font-medium text-primary hover:underline">
                Inicia sesión
              </button>
            </>
          )}
        </p>

        <p className="mt-6 text-center text-xs text-muted-foreground">Acceso para estudiantes y docentes de la UFPS</p>
      </div>
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </div>
  )
}
