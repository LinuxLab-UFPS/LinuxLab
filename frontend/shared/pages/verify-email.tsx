"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { notify } from "@shared/lib/toast"
import { useAuth } from "@/lib/features/auth/context"
import { getFirebaseAuth } from "@/lib/features/auth/firebase"

export function VerifyEmailPage({ email }: { email: string }) {
  const router = useRouter()
  const { resendVerification } = useAuth()
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const handleResend = async () => {
    if (cooldown > 0) return
    setSending(true)
    try {
        try {
          await resendVerification()
        } catch {
          const { auth } = getFirebaseAuth()
          const u = auth.currentUser
          if (u) {
            const { sendEmailVerification } = await import("firebase/auth")
            const { env } = await import("@/lib/config/env")
            await sendEmailVerification(u, { url: `${env.frontendUrl}/auth/accion`, handleCodeInApp: true })
          } else {
            throw new Error("Abre el enlace desde el mismo navegador donde te registraste.")
          }
        }
      notify.success("Correo reenviado. Revisa tu bandeja.")
      setCooldown(60)
      const id = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(id)
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch (e) {
      notify.error(e, "No se pudo reenviar el correo.")
    } finally {
      setSending(false)
    }
  }

  const handleChecked = async () => {
    setChecking(true)
    try {
      const { auth } = getFirebaseAuth()
      const u = auth.currentUser
      if (u) {
        await u.reload()
        if (u.emailVerified) {
          const idToken = await u.getIdToken()
          const { apiFetch } = await import("@/lib/api/client")
          await apiFetch("/api/auth/firebase", { method: "POST", body: JSON.stringify({ idToken }) })
          router.push("/inicio")
          return
        }
      }
      const { signOut } = await import("firebase/auth")
      try {
        await signOut(getFirebaseAuth().auth)
      } catch {}
      router.push("/login")
      notify.info("Aún no verificado. Revisa tu correo y vuelve a iniciar sesión.")
    } catch (e) {
      notify.error(e, "No se pudo verificar el estado.")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Verifica tu correo</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Enviamos un enlace de verificación a <span className="font-medium text-foreground">{email}</span>. Debes verificar tu correo para poder iniciar sesión.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Revisa spam si no lo ves. El enlace expira en 1 hora.</p>
        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={handleResend} disabled={sending || cooldown > 0} className="h-11 w-full">
            {cooldown > 0 ? `Reenviar en ${cooldown}s` : sending ? "Enviando…" : "Reenviar correo"}
          </Button>
          <Button variant="outline" onClick={handleChecked} disabled={checking} className="h-11 w-full">
            {checking ? "Verificando…" : "Ya verifiqué, continuar"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/login")} className="h-11 w-full">
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
