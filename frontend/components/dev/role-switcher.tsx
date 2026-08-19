"use client"

import { useEffect, useState } from "react"

/**
 * Selector de rol SOLO para desarrollo.
 *
 * Cambia el rol de la sesión falsa (ver el bypass en middleware.ts,
 * lib/features/auth/session.ts y lib/features/auth/context.tsx) escribiendo la
 * cookie `dev-role` y recargando, para saltar entre las vistas de estudiante,
 * docente y admin sin backend ni login.
 *
 * Va flotante en una esquina a propósito: así no depende de ningún header ni
 * sidebar y no se pierde cuando esas vistas se rediseñan.
 *
 * No renderiza nada en producción.
 */
const ROLES = ["student", "teacher", "admin"] as const
type DevRole = (typeof ROLES)[number]

const LABEL: Record<DevRole, string> = {
  student: "Estudiante",
  teacher: "Docente",
  admin: "Admin",
}

function readDevRole(): DevRole {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("dev-role="))
    ?.split("=")[1]
  return raw === "teacher" || raw === "admin" ? raw : "student"
}

export function DevRoleSwitcher() {
  const [role, setRole] = useState<DevRole>("student")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setRole(readDevRole())
    setMounted(true)
  }, [])

  if (process.env.NODE_ENV === "production" || !mounted) return null

  const change = (next: DevRole) => {
    document.cookie = `dev-role=${next}; path=/; max-age=31536000`
    window.location.reload()
  }

  return (
    // Corrido a la derecha: en `left-3` cae justo debajo del indicador de dev
    // de Next, que vive en esa misma esquina y lo tapa.
    <div className="fixed bottom-3 left-16 z-[100] rounded-lg border border-border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Vista (dev)
      </p>
      <div className="flex gap-1">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => change(r)}
            className={
              r === role
                ? "rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
                : "rounded px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            }
          >
            {LABEL[r]}
          </button>
        ))}
      </div>
    </div>
  )
}
