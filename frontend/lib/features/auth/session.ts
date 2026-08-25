import { apiFetch } from "@/lib/api/client"
import { env } from "@/lib/config/env"
import type { Role, Session } from "@/lib/features/auth/types"

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

export async function getServerSession(): Promise<Session | null> {
  const { cookies } = await import("next/headers")
  const token = (await cookies()).get("token")?.value
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
        code: (payload.code as string | null | undefined) ?? null,
        hasEnrollment: (payload.hasEnrollment as boolean | undefined) ?? false,
      },
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getServerSession()
  if (!session) {
    const { redirect } = await import("next/navigation")
    redirect("/login")
    throw new Error("unreachable")
  }
  return session
}

export async function requireServerRole(allowedRoles: Role[]): Promise<Session> {
  const session = await getServerSession()
  if (!session) {
    const { redirect } = await import("next/navigation")
    redirect("/login")
    throw new Error("unreachable")
  }
  if (!allowedRoles.includes(session.user.role)) {
    const { redirect } = await import("next/navigation")
    redirect("/unauthorized")
    throw new Error("unreachable")
  }
  return session
}

export async function requireEnrollment(): Promise<Session> {
  const session = await requireAuth()
  if (session.user.role === "student" && session.user.hasEnrollment === false) {
    const { redirect } = await import("next/navigation")
    redirect("/inscripcion/pendiente")
    throw new Error("unreachable")
  }
  return session
}
