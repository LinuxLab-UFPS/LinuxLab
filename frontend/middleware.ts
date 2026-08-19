import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { ROUTE_RULES } from "@shared/lib/rules"
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

  // ######################################################################
  // ## DEV: sin backend no hay token que verificar, así que se deja      ##
  // ## pasar todo y el rol lo decide la cookie `dev-role` (selector de   ##
  // ## rol). Se apaga solo en producción.                                ##
  // ## Ver: lib/features/auth/session.ts y context.tsx.                  ##
  // ######################################################################
  const devRole = request.cookies.get("dev-role")?.value
  if (process.env.NODE_ENV !== "production" && (!token || devRole)) {
    return NextResponse.next()
  }

  // Root redirect for authed users
  if (pathname === "/") {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET)
        return NextResponse.redirect(new URL("/home", request.url))
      } catch {
        return NextResponse.next()
      }
    }
    return NextResponse.next()
  }

  const rule = ROUTE_RULES.find((r) => matchesRoute(pathname, r))
  if (!rule) return NextResponse.next()

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = payload.role as Role
    if (!rule.roles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/", request.url))
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|__/auth|.*\\.png$|.*\\.svg$).*)",
  ],
}
