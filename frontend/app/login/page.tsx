"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/features/auth/context"
import { notify } from "@shared/lib/toast"
import { destinoSeguro } from "@shared/lib/next-url"

function LoginForm() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (!user) return
    // El admin no tiene curso al que volver: su sitio es siempre el panel.
    // Para el resto manda el destino que venia en `?next=`, ya validado.
    const target =
      user.role === "admin" ? "/admin/docentes" : destinoSeguro(params.get("next"))
    router.replace(target)
  }, [user, router, params])

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      notify.error(err, "No se pudo iniciar sesión.")
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 shadow-xl">
        {/* El icono de la aplicacion, el mismo de la pestaña del navegador. Va
            solo, sin la caja de color que llevaba el icono generico: ya es una
            ficha con su fondo y su borde, y una ficha dentro de otra se ve
            como un error. `alt` vacio porque el titulo que sigue dice lo
            mismo, y repetirlo solo molesta a quien use lector de pantalla. */}
        <Image
          src="/icon.svg"
          alt=""
          width={64}
          height={64}
          priority
          className="mx-auto mb-6 h-16 w-16"
        />
        <h1 className="text-center text-2xl font-bold text-foreground">Linux Lab UFPS</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Laboratorio Virtual de Linux para Sistemas Operativos
        </p>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            disabled={loading || signingIn}
            onClick={handleGoogleSignIn}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-input bg-background font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acceso exclusivo para estudiantes y docentes de la UFPS
        </p>
      </div>
    </div>
  )
}

/**
 * `useSearchParams` obliga a un limite de Suspense: sin el, Next no puede
 * prerenderizar esta pagina y la build falla. El respaldo va vacio a proposito,
 * porque lo unico que se espera es leer `?next=` y eso tarda un instante.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
