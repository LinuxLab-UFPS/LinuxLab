"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, CheckCircle2, AlertTriangle, Mail, KeyRound } from "lucide-react"
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { getFirebaseAuth } from "@/lib/features/auth/firebase"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { notify } from "@shared/lib/toast"
import { mapFirebaseError, errorCodeOf } from "@/lib/features/auth/errors"

type Mode = "verifyEmail" | "resetPassword" | "recoverEmail" | "unknown"

function AuthAccionInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const mode = (sp.get("mode") as Mode) ?? "unknown"
  const oobCode = sp.get("oobCode") ?? sp.get("oob_code") ?? ""

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "form">("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!oobCode) {
      queueMicrotask(() => {
        if (!cancelled) {
          setStatus("error")
          setMessage("Enlace inválido o expirado. Solicita uno nuevo.")
        }
      })
      return () => {
        cancelled = true
      }
    }
    if (mode === "verifyEmail") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("loading")
      setMessage("Verificando tu correo…")
      const run = async () => {
        try {
          const { auth } = getFirebaseAuth()
          await applyActionCode(auth, oobCode)
          if (auth.currentUser) {
            try {
              await auth.currentUser.reload()
            } catch {}
          }
          if (!cancelled) {
            setStatus("success")
            setMessage("Correo verificado. Ya puedes iniciar sesión.")
            notify.success("Correo verificado.")
          }
        } catch (e) {
          const code = errorCodeOf(e)
          if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") {
            const { auth } = getFirebaseAuth()
            const u = auth.currentUser
            if (u) {
              try {
                await u.reload()
                if (u.emailVerified) {
                  if (!cancelled) {
                    setStatus("success")
                    setMessage("Tu correo ya estaba verificado. Puedes iniciar sesión.")
                    notify.success("Correo ya verificado.")
                  }
                  return
                }
              } catch {}
            }
            if (!cancelled) {
              setStatus("error")
              setMessage("El enlace ya fue usado o expiró. Solicita uno nuevo desde Verificación.")
            }
            return
          }
          if (!cancelled) {
            setStatus("error")
            setMessage(mapFirebaseError(code, "No se pudo verificar el correo. El enlace puede haber expirado."))
          }
        }
      }
      run()
    } else if (mode === "resetPassword") {
       
      setStatus("loading")
      const run = async () => {
        try {
          const { auth } = getFirebaseAuth()
          const em = await verifyPasswordResetCode(auth, oobCode)
          if (!cancelled) {
            setEmail(em)
            setStatus("form")
          }
        } catch (e) {
          if (!cancelled) {
            setStatus("error")
            setMessage(mapFirebaseError(errorCodeOf(e), "Enlace de recuperación inválido o expirado."))
          }
        }
      }
      run()
    } else if (mode === "recoverEmail") {
      queueMicrotask(() => {
        if (!cancelled) {
          setStatus("error")
          setMessage("Recuperación de correo no soportada en esta vista.")
        }
      })
    } else {
      queueMicrotask(() => {
        if (!cancelled) {
          setStatus("error")
          setMessage("Acción no reconocida.")
        }
      })
    }
    return () => {
      cancelled = true
    }
  }, [mode, oobCode])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass.length < 6) {
      notify.error(null, "La contraseña debe tener al menos 6 caracteres.")
      return
    }
    if (newPass !== confirmPass) {
      notify.error(null, "Las contraseñas no coinciden.")
      return
    }
    setSubmitting(true)
    try {
      const { auth } = getFirebaseAuth()
      await confirmPasswordReset(auth, oobCode, newPass)
      setStatus("success")
      setMessage("Contraseña restablecida. Inicia sesión con tu nueva contraseña.")
      notify.success("Contraseña actualizada.")
      setTimeout(() => router.replace("/login"), 1200)
    } catch (err) {
      notify.error(err, mapFirebaseError(errorCodeOf(err), "No se pudo restablecer la contraseña."))
    } finally {
      setSubmitting(false)
    }
  }

    return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 text-center shadow-xl">
        {status === "loading" ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-8 w-8 animate-pulse text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{message ?? "Cargando…"}</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{mode === "resetPassword" ? "Contraseña actualizada" : "Verificación completada"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button onClick={() => router.replace("/login")} className="mt-8 h-11 w-full">
              Ir a iniciar sesión
            </Button>
          </>
        ) : status === "form" ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Restablecer contraseña</h1>
            {email ? <p className="mt-1 text-xs text-muted-foreground">{email}</p> : null}
            <form onSubmit={handleReset} className="mt-6 space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="newPass">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPass"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="h-11 pr-10"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                    aria-label={show ? "Ocultar" : "Mostrar"}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPass">Confirmar contraseña</Label>
                <Input
                  id="confirmPass"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="h-11"
                  placeholder="Repite la contraseña"
                />
              </div>
              <Button type="submit" disabled={submitting} className="h-11 w-full">
                {submitting ? "Guardando…" : "Guardar nueva contraseña"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">No se pudo completar</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message ?? "Enlace inválido."}</p>
            <div className="mt-8 flex flex-col gap-3">
              <Button onClick={() => router.replace("/login")} className="h-11 w-full">
                Volver a iniciar sesión
              </Button>
              <Button variant="outline" onClick={() => router.replace("/auth/verificacion")} className="h-11 w-full">
                Reenviar verificación
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthAccionPage() {
  return (
    <Suspense fallback={null}>
      <AuthAccionInner />
    </Suspense>
  )
}
