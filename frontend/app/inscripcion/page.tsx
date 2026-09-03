"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, CheckCircle2, GraduationCap, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/features/auth/context"
import { enrollApi, type GroupInviteInfo } from "@/lib/features/enrollment/api"
import { CompleteProfileView } from "@/lib/features/auth/components/complete-profile-view"
import { Button } from "@shared/components/ui/button"
import { notify } from "@shared/lib/toast"

type Status = "loading" | "invalid" | "ready" | "joining"

function InscripcionInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const token = sp.get("token") ?? ""
  const groupId = sp.get("group") ?? ""
  const { user, loading } = useAuth()
  const [info, setInfo] = useState<GroupInviteInfo | null>(null)
  const [status, setStatus] = useState<Status>("loading")

  useEffect(() => {
    let cancelled = false
    if (!token || !groupId) {
      queueMicrotask(() => {
        if (!cancelled) setStatus("invalid")
      })
      return
    }
    enrollApi
      .getInfo(groupId, token)
      .then((data) => {
        if (cancelled) return
        setInfo(data)
        setStatus("ready")
      })
      .catch(() => {
        if (!cancelled) setStatus("invalid")
      })
    return () => {
      cancelled = true
    }
  }, [token, groupId])

  /* Misma puerta que el layout protegido: nadie se inscribe con un perfil a
     medias. Aquí el formulario toma toda la pantalla y, al completarse, el
     enlace de invitación sigue intacto en la URL para continuar el flujo.
     Va después de los hooks: un retorno antes haría condicional el useEffect. */
  if (!loading && user && user.role === "student" && !user.code) {
    return <CompleteProfileView defaultName={user.name} />
  }

  const goToLogin = () => {
    const current = `${window.location.pathname}${window.location.search}`
    router.push(`/login?next=${encodeURIComponent(current)}`)
  }

  const handleEnroll = async () => {
    setStatus("joining")
    try {
      const res = await enrollApi.join(groupId, token)
      if (res.enrolled) {
        notify.success(`¡Inscrito en ${res.groupName ?? info?.name ?? "el grupo"}!`)
        router.replace("/inicio")
        return
      }
      if (res.reason === "already_enrolled") {
        notify.info("Ya estabas inscrito en este grupo")
        router.replace("/inicio")
        return
      }
      setStatus("ready")
    } catch (e) {
      notify.error(e, "No se pudo completar la inscripción.")
      setStatus("ready")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>

        {status === "loading" ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Consultando el grupo…</p>
          </div>
        ) : status === "invalid" ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Enlace no válido</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Este enlace de inscripción no existe o el grupo ya no está activo. Solicita uno nuevo
              a tu docente.
            </p>
            <Button onClick={() => router.replace("/login")} className="mt-8 h-11 w-full">
              Ir a iniciar sesión
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground">{info?.name ?? "Grupo"}</h1>
            {info?.teacherName ? (
              <p className="mt-1 text-sm text-muted-foreground">Docente: {info.teacherName}</p>
            ) : null}
            {info?.description ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{info.description}</p>
            ) : null}

            <div className="mt-8">
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando tu sesión…</p>
              ) : !user ? (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Para inscribirte necesitas una cuenta con el correo que usarás en el curso.
                  </p>
                  <Button onClick={goToLogin} className="h-11 w-full">
                    Iniciar sesión para inscribirme
                  </Button>
                </>
              ) : user.role !== "student" ? (
                <p className="text-sm text-muted-foreground">
                  Solo los estudiantes pueden inscribirse con este enlace.
                </p>
              ) : info?.enrolled ? (
                <>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">Ya estás inscrito en este grupo.</p>
                  <Button onClick={() => router.replace("/inicio")} className="mt-6 h-11 w-full">
                    Ir a mi tablero
                  </Button>
                </>
              ) : (
                <Button onClick={handleEnroll} disabled={status === "joining"} className="h-11 w-full">
                  {status === "joining" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Inscribiéndome…
                    </>
                  ) : (
                    "Inscribirme en este grupo"
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function InscripcionPage() {
  return (
    <Suspense fallback={null}>
      <InscripcionInner />
    </Suspense>
  )
}