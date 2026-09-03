"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  signUpWithEmail: (email: string, password: string, name: string, code: string, next?: string) => Promise<{ needsVerification: boolean }>
  sendPasswordReset: (email: string) => Promise<{ debugLink?: string }>
  resendVerification: (next?: string) => Promise<{ debugLink?: string }>
  hydrate: (user: User | null) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

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

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string, code: string, next?: string) => {
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
        await apiFetch("/api/students/register", {
          method: "POST",
          body: JSON.stringify({ email, name: name.trim(), code: code.trim() }),
        })
      } catch (e) {
        // El usuario ya quedó creado en Firebase; si falla el alta en la
        // plataforma lo reportamos para no dejar la cuenta a medias.
        throw new Error(mapFirebaseError(errorCodeOf(e), "No se pudo registrar la cuenta en la plataforma."))
      }
      try {
        await apiFetch("/api/auth/request-verification", {
          method: "POST",
          body: JSON.stringify({ email, next }),
        })
      } catch {}
      try {
        await firebaseSignOut(auth)
      } catch {}
      return { needsVerification: true }
    },
    [],
  )

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      const data = await apiFetch<{ message: string; debugLink?: string }>("/api/auth/request-password-reset", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      if (data.debugLink) console.log("[PoC] custom reset link:", data.debugLink)
      return { debugLink: data.debugLink }
    } catch (e) {
      throw new Error(mapFirebaseError(errorCodeOf(e), "No se pudo enviar el correo de recuperación."))
    }
  }, [])

  const resendVerification = useCallback(async (next?: string) => {
    let email: string | null = null
    try {
      const { auth } = getFirebaseAuth()
      email = auth.currentUser?.email ?? null
    } catch {}
    if (!email) {
      try {
        email = sessionStorage.getItem("pendingVerifyEmail")
      } catch {}
    }
    if (!email) throw new Error("No hay correo para reenviar verificación. Vuelve a registrarte.")
    try {
      const data = await apiFetch<{ message: string; debugLink?: string }>("/api/auth/request-verification", {
        method: "POST",
        body: JSON.stringify({ email, next }),
      })
      if (data.debugLink) console.log("[PoC] custom verify link:", data.debugLink)
      return { debugLink: data.debugLink }
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
    // La cache de React Query se indexa solo por su clave, sin nada del usuario
    // dentro: si no se vacia al salir, la siguiente cuenta que entre en este
    // mismo navegador ve las respuestas de la anterior. El sintoma era un
    // estudiante con las actividades de otro marcadas como completadas.
    queryClient.clear()
  }, [queryClient])

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
