"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Terminal } from "lucide-react"
import { useAuth } from "@/lib/features/auth/context"

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (!user) return
    const target = user.role === "student" ? "/home" : "/home"
    router.replace(target)
  }, [user, router])

  const handleGoogleSignIn = async () => {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.")
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1b2433] p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl px-8 py-10">
        <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-xl flex items-center justify-center">
          <Terminal className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-[#1c2128] text-center">Linux Lab UFPS</h1>
        <p className="text-[#5b626b] mt-2 text-center text-sm">
          Laboratorio Virtual de Linux para Sistemas Operativos
        </p>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            disabled={loading || signingIn}
            onClick={handleGoogleSignIn}
            className="w-full h-11 rounded-md bg-white border border-[#e2e5ea] text-[#1c2128] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {signingIn ? "Iniciando sesión…" : "Iniciar sesión con Google"}
          </button>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
          )}
        </div>

        <p className="mt-6 text-xs text-[#5b626b] text-center">
          Acceso exclusivo para estudiantes y docentes de la UFPS
        </p>
      </div>
    </div>
  )
}
