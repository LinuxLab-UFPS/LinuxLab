"use client"

import { useEffect, useState } from "react"

/**
 * Selector de rol SOLO para desarrollo. Vive en el footer de la sidebar de home.
 * Cambia el rol de la sesion falsa (ver el bypass en lib/features/auth/session.ts)
 * escribiendo la cookie "dev-role" y recargando, para saltar entre las vistas de
 * estudiante, docente y admin sin editar codigo.
 *
 * No renderiza nada en produccion.
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

  useEffect(() => {
    setRole(readDevRole())
  }, [])

  if (process.env.NODE_ENV === "production") return null

  const change = (r: DevRole) => {
    document.cookie = `dev-role=${r}; path=/; max-age=31536000`
    // Recarga completa para que el server vuelva a renderizar con el rol nuevo.
    window.location.reload()
  }

  return (
    <div className="border-t border-border p-3">
      <p className="px-1 pb-1.5 text-[10px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">
        Vista (dev)
      </p>
      <div className="flex gap-1">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => change(r)}
            className={
              "flex-1 rounded-md px-2 py-1 text-xs transition-colors " +
              (role === r
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60")
            }
          >
            {LABEL[r]}
          </button>
        ))}
      </div>
    </div>
  )
}
