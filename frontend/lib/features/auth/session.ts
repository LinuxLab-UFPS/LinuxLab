import { apiFetch } from "@/lib/api/client"
import { env } from "@/lib/config/env"
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
 * Server-side role guard for server components.
 * Call at the top of page/layout server components.
 * Redirects if not authenticated or role doesn't match.
 */
export async function requireServerRole(allowedRoles: Role[]): Promise<Session> {
  const session = await getServerSession()
  if (!session) {
    const { redirect } = await import("next/navigation")
    redirect("/")
    throw new Error("unreachable")
  }
  if (!allowedRoles.includes(session.user.role)) {
    const { redirect } = await import("next/navigation")
    redirect("/unauthorized")
    throw new Error("unreachable")
  }
  return session
}

/**
 * Server-side session check.
 * Reads the JWT cookie directly from the request — no fetch to backend.
 * Use in server components / layouts.
 */
export async function getServerSession(): Promise<Session | null> {
  const { cookies } = await import("next/headers")
  const store = await cookies()
  const token = store.get("token")?.value
  const raw = store.get("dev-role")?.value

  // ######################################################################
  // ## DEV: sin backend no hay token, así que devolvemos una sesión      ##
  // ## falsa con el rol de la cookie `dev-role` (selector de rol) para   ##
  // ## poder abrir las vistas sin login. Se apaga solo en producción.    ##
  // ## Ver: middleware.ts y lib/features/auth/context.tsx.               ##
  // ######################################################################
  if (raw && process.env.NODE_ENV !== "production") {
    const role: Role = raw === "teacher" || raw === "admin" ? raw : "student"
    return { user: { id: "dev", email: "dev@ufps.edu.co", name: "Modo Dev", role } }
  }

  if (!token) return null

  try {
    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(env.jwtSecret)
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
