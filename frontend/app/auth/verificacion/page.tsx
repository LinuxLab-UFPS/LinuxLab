"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { VerifyEmailPage } from "@shared/pages/verify-email"

function VerificarCorreoInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const next = sp.get("next")

  useEffect(() => {
    const oobCode = sp.get("oobCode") ?? sp.get("oob_code")
    const mode = sp.get("mode")
    if (oobCode && mode) {
      const target = `/auth/accion?mode=${mode}&oobCode=${encodeURIComponent(oobCode)}${next ? `&next=${encodeURIComponent(next)}` : ""}`
      router.replace(target)
      return
    }
    let cancelled = false
    const resolve = async () => {
      try {
        const { getFirebaseAuth } = await import("@/lib/features/auth/firebase")
        const { auth } = getFirebaseAuth()
        const u = auth.currentUser
        if (u?.email) {
          if (!cancelled) setEmail(u.email)
          return
        }
      } catch {}
      try {
        const pending = sessionStorage.getItem("pendingVerifyEmail")
        if (pending) {
          if (!cancelled) setEmail(pending)
          return
        }
      } catch {}
      router.replace(next ? `/login?next=${encodeURIComponent(next)}` : "/login")
    }
    resolve()
    return () => {
      cancelled = true
    }
  }, [router, sp, next])

  if (!email) return null
  return <VerifyEmailPage email={email} next={next} />
}

export default function VerificarCorreoPage() {
  return (
    <Suspense fallback={null}>
      <VerificarCorreoInner />
    </Suspense>
  )
}
