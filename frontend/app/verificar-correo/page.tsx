"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { VerifyEmailPage } from "@shared/pages/verify-email"

export default function VerificarCorreoPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
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
      router.replace("/")
    }
    resolve()
    return () => {
      cancelled = true
    }
  }, [router])

  if (!email) return null
  return <VerifyEmailPage email={email} />
}
