import { apiFetch } from "@/lib/api/client"
import type { Role, Session } from "@/lib/features/auth/types"

/**
 * Client-side session check.
 * Used by client components (e.g. AuthProvider).
 */
export async function getSession(): Promise<Session | null> {
  try {
    const data = await apiFetch<{ user: Session["user"] }>("/api/auth/me")
    return { user: data.user }
  } catch {
    return null
  }
}

export async function requireRole(role: Role): Promise<Session> {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized: no active session.")
  }
  if (session.user.role !== role) {
    throw new Error(`Forbidden: requires role "${role}".`)
  }
  return session
}

/**
 * Server-side session check.
 * Reads the JWT cookie directly from the request — no fetch to backend.
 * Use in server components / layouts.
 */
export async function getServerSession(): Promise<Session | null> {
  // ##########################################################################
  // ## AUTH DESACTIVADA PARA DESARROLLO. NO TOCAR HASTA TERMINAR EL         ##
  // ## PROYECTO. Sesion falsa para no exigir login. Se apaga sola en        ##
  // ## produccion. Cambia role a "teacher"/"admin" si necesitas esas        ##
  // ## vistas; para reactivar auth en local, borra este bloque.             ##
  // ##########################################################################
  if (process.env.NODE_ENV !== "production") {
    // El rol lo controla el switcher de dev (cookie "dev-role"). Default: student.
    const { cookies } = await import("next/headers")
    const devRole = (await cookies()).get("dev-role")?.value
    const role: Role =
      devRole === "teacher" || devRole === "admin" ? devRole : "student"
    return {
      user: { id: "dev", email: "dev@ufps.edu.co", name: "Modo Dev", role },
    }
  }

  const { cookies } = await import("next/headers")
  const token = (await cookies()).get("token")?.value
  if (!token) return null

  try {
    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "linuxlab-jwt-secret-2026",
    )
    const { payload } = await jwtVerify(token, secret)
    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as Role,
      },
    }
  } catch {
    return null
  }
}
