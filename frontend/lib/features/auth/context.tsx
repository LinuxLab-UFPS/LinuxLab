"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth"
import { getFirebaseAuth } from "@/lib/features/auth/firebase"
import { apiFetch } from "@/lib/api/client"
import type { User } from "@/lib/features/auth/types"

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
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
    const result = await signInWithPopup(auth, googleProvider)
    const idToken = await result.user.getIdToken()

    const userEmail = result.user.email
    if (!userEmail?.endsWith("@ufps.edu.co")) {
      throw new Error("Solo se permiten correos institucionales @ufps.edu.co")
    }

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
