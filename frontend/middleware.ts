import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { ROUTE_RULES, PUBLIC_ROUTES } from "@shared/lib/rules"
import { env } from "@/lib/config/env"
import type { Role } from "@/lib/models/auth"
import type { RouteRule } from "@/lib/models/content"

const JWT_SECRET = new TextEncoder().encode(env.jwtSecret)

function matchesRoute(pathname: string, rule: RouteRule): boolean {
  return rule.exact ? pathname === rule.path : pathname.startsWith(rule.path)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("token")?.value

  if (pathname === "/") {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET)
        return NextResponse.redirect(new URL("/inicio", request.url))
      } catch {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const rule = ROUTE_RULES.find((r) => matchesRoute(pathname, r))

  const isPublic = !rule || PUBLIC_ROUTES.has(pathname) || rule.roles.length === 0
  if (isPublic) {
    if (token && (pathname === "/login" || pathname === "/auth/verificacion")) {
      try {
        await jwtVerify(token, JWT_SECRET)
        return NextResponse.redirect(new URL("/inicio", request.url))
      } catch {}
    }
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = payload.role as Role
    if (!rule.roles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
    const hasEnrollment = (payload.hasEnrollment as boolean | undefined) ?? false
    if (role === "student" && hasEnrollment === false && rule.requiresEnrollment) {
      return NextResponse.redirect(new URL("/inscripcion/pendiente", request.url))
    }
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|__/auth|.*\\.png$|.*\\.svg$).*)"],
}
