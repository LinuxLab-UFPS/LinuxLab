import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { adminRules } from "@/lib/features/admin/rules"
import { teacherRules } from "@/lib/features/teacher/rules"
import { studentRules } from "@/lib/features/student/rules"
import { sharedRules } from "@/lib/features/shared/rules"
import type { RouteRule } from "@/lib/features/shared/types"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "linuxlab-jwt-secret-2026",
)

const ROUTE_RULES: RouteRule[] = [
  ...adminRules,
  ...teacherRules,
  ...studentRules,
  ...sharedRules,
]

function matchesRoute(pathname: string, rule: RouteRule): boolean {
  return rule.exact ? pathname === rule.path : pathname.startsWith(rule.path)
}

export async function middleware(request: NextRequest) {
  // ##########################################################################
  // ## AUTH DESACTIVADA PARA DESARROLLO. NO TOCAR HASTA TERMINAR EL         ##
  // ## PROYECTO. Deja navegar sin iniciar sesion. Se reactiva sola en       ##
  // ## produccion; para reactivarla en local, borra este bloque.           ##
  // ##########################################################################
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  if (pathname === "/") {
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.next()

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      return NextResponse.redirect(new URL("/home", request.url))
    } catch {
      return NextResponse.next()
    }
  }

  const rule = ROUTE_RULES.find((r) => matchesRoute(pathname, r))
  if (!rule) return NextResponse.next()

  const token = request.cookies.get("token")?.value
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = payload.role as string
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
