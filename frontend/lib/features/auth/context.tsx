"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth"
import { getFirebaseAuth } from "@/lib/features/auth/firebase"
import { apiFetch } from "@/lib/api/client"
import { terminarSesion } from "@shared/lib/terminal-session"
import type { Role, User } from "@/lib/features/auth/types"

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** DEV only: usuario falso con el rol elegido en el selector (cookie `dev-role`). */
function devUser(): User {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("dev-role="))
    ?.split("=")[1]
  const role: Role = raw === "teacher" || raw === "admin" ? raw : "student"
  return { id: "dev", email: "dev@ufps.edu.co", name: "Modo Dev", role }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // El selector de rol manda sobre la sesión real mientras esté puesto.
    if (process.env.NODE_ENV !== "production" && document.cookie.includes("dev-role=")) {
      setUser(devUser())
      setLoading(false)
      return
    }
    apiFetch<{ user: User }>("/api/auth/me")
      .then((data) => setUser(data.user))
      // ######################################################################
      // ## DEV: si el backend no responde (correr solo el frontend), caemos ##
      // ## a un usuario falso para que RoleGuard y las vistas no queden en  ##
      // ## blanco. El rol sale de la cookie `dev-role` (selector de rol).   ##
      // ## Se apaga solo en producción. Ver: middleware.ts y session.ts.    ##
      // ######################################################################
      .catch(() => setUser(process.env.NODE_ENV === "production" ? null : devUser()))
      .finally(() => setLoading(false))
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { auth, googleProvider } = getFirebaseAuth()
    const result = await signInWithPopup(auth, googleProvider)
    const idToken = await result.user.getIdToken()

    // const userEmail = result.user.email
    // if (!userEmail?.endsWith("@ufps.edu.co")) {
    //   throw new Error("Solo se permiten correos institucionales @ufps.edu.co")
    // }

    const data = await apiFetch<{ user: User }>("/api/auth/firebase", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    })

    setUser(data.user)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(getFirebaseAuth().auth)
    } catch {
      // Ignore firebase signOut errors (incl. "not configured")
    }
    try {
      await apiFetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Ignore backend logout errors
    }
    // La terminal ya no vive dentro de un componente: sin esto, su socket y la
    // PTY del entorno seguirian abiertos despues de cerrar sesion.
    terminarSesion()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
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
