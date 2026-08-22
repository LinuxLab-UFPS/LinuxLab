"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth"
import { getFirebaseAuth } from "@/lib/features/auth/firebase"
import { apiFetch } from "@/lib/api/client"
import { terminarSesion } from "@shared/lib/terminal-session"
import type { User } from "@/lib/features/auth/types"
import { errorCodeOf, mapFirebaseError } from "@/lib/features/auth/errors"

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ needsVerification: boolean }>
  sendPasswordReset: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
  hydrate: (user: User | null) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<{ user: User }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { auth, googleProvider } = getFirebaseAuth()
    let result
    try {
      result = await signInWithPopup(auth, googleProvider)
    } catch (e) {
      const code = errorCodeOf(e)
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        const err = new Error("__silent__")
        ;(err as unknown as Record<string, unknown>).code = code
        throw err
      }
      throw new Error(mapFirebaseError(code, "No se pudo iniciar sesión con Google."))
    }
    const idToken = await result.user.getIdToken()
    const data = await apiFetch<{ user: User }>("/api/auth/firebase", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    })
    setUser(data.user)
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { auth } = getFirebaseAuth()
    let cred
    try {
      cred = await signInWithEmailAndPassword(auth, email, password)
    } catch (e) {
      throw new Error(mapFirebaseError(errorCodeOf(e), "No se pudo iniciar sesión."))
    }
    if (!cred.user.emailVerified) {
      try {
        await firebaseSignOut(auth)
      } catch {}
      const err = new Error("Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.")
      ;(err as unknown as Record<string, unknown>).code = "auth/email-not-verified"
      throw err
    }
    const idToken = await cred.user.getIdToken()
    const data = await apiFetch<{ user: User }>("/api/auth/firebase", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    })
    setUser(data.user)
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    const { auth } = getFirebaseAuth()
    let cred
    try {
      cred = await createUserWithEmailAndPassword(auth, email, password)
    } catch (e) {
      throw new Error(mapFirebaseError(errorCodeOf(e), "No se pudo crear la cuenta."))
    }
    try {
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() })
    } catch {}
    try {
      const { env } = await import("@/lib/config/env")
      await sendEmailVerification(cred.user, { url: `${env.frontendUrl}/auth/accion`, handleCodeInApp: true })
    } catch {}
    try {
      await firebaseSignOut(auth)
    } catch {}
    return { needsVerification: true }
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    const { auth } = getFirebaseAuth()
    try {
      const { env } = await import("@/lib/config/env")
      await sendPasswordResetEmail(auth, email, { url: `${env.frontendUrl}/auth/accion`, handleCodeInApp: true })
    } catch (e) {
      throw new Error(mapFirebaseError(errorCodeOf(e), "No se pudo enviar el correo de recuperación."))
    }
  }, [])

  const resendVerification = useCallback(async () => {
    const { auth } = getFirebaseAuth()
    const u = auth.currentUser
    if (!u) throw new Error("No hay sesión activa para reenviar verificación.")
    try {
      const { env } = await import("@/lib/config/env")
      await sendEmailVerification(u, { url: `${env.frontendUrl}/auth/accion`, handleCodeInApp: true })
    } catch (e) {
      throw new Error(mapFirebaseError(errorCodeOf(e), "No se pudo reenviar el correo."))
    }
  }, [])

  const hydrate = useCallback((nextUser: User | null) => setUser(nextUser), [])

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(getFirebaseAuth().auth)
    } catch {}
    try {
      await apiFetch("/api/auth/logout", { method: "POST" })
    } catch {}
    terminarSesion()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, resendVerification, hydrate, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>.")
  }
  return ctx
}

export function initialsOf(name: string | undefined | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}
