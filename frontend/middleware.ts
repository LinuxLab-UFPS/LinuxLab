import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { ROUTE_RULES } from "@shared/lib/rules"
import { conNext } from "@shared/lib/next-url"
import { env } from "@/lib/config/env"
import type { Role } from "@/lib/models/auth"
import type { RouteRule } from "@/lib/models/content"

const JWT_SECRET = new TextEncoder().encode(env.jwtSecret)

function matchesRoute(pathname: string, rule: RouteRule): boolean {
  return rule.exact ? pathname === rule.path : pathname.startsWith(rule.path)
}

/**
 * El login, recordando de donde se venia.
 *
 * Se guarda la ruta con su cadena de consulta: un estudiante al que se le
 * caduco la sesion leyendo una leccion vuelve a esa leccion y no al principio
 * del curso.
 */
function alLogin(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  return NextResponse.redirect(new URL(conNext(pathname + search), request.url))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get("token")?.value

  // `/` es la portada publica y la ve todo el mundo, con sesion o sin ella.
  // Antes rebotaba a `/home` a quien ya habia entrado, y con la portada aqui eso
  // significaba que nadie logueado podia verla nunca.
  if (pathname === "/") return NextResponse.next()

  const rule = ROUTE_RULES.find((r) => matchesRoute(pathname, r))
  if (!rule) return NextResponse.next()

  if (!token) return alLogin(request)

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = payload.role as Role
    if (!rule.roles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
    return NextResponse.next()
  } catch {
    return alLogin(request)
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|__/auth|.*\\.png$|.*\\.svg$).*)",
  ],
}
