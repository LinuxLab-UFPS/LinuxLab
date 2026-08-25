import type { RouteRule } from "@/lib/models/content"

export const ROUTE_RULES: RouteRule[] = [
  { path: "/login", roles: [], exact: true },
  { path: "/auth/verificacion", roles: [], exact: true },
  { path: "/auth/accion", roles: [], exact: true },
  { path: "/auth/reset-password", roles: [], exact: true },
  { path: "/unauthorized", roles: [], exact: true },
  { path: "/inscripcion/pendiente", roles: ["student", "admin"], exact: true, requiresEnrollment: false },
  { path: "/inicio", roles: ["student", "teacher", "admin"], exact: true, requiresEnrollment: true },
  { path: "/admin", roles: ["admin"] },
  { path: "/admin/bitacora", roles: ["admin"], exact: true },
  { path: "/grupos", roles: ["teacher", "admin"] },
  { path: "/grupos/crear", roles: ["teacher", "admin"], exact: true },
  { path: "/terminal", roles: ["student", "teacher", "admin"], exact: true, requiresEnrollment: true },
  { path: "/contenidos", roles: ["student", "admin"], requiresEnrollment: true },
  { path: "/curso", roles: ["student", "teacher", "admin"], exact: true, requiresEnrollment: true },
  { path: "/estudiante/grupo", roles: ["student", "admin"], exact: true, requiresEnrollment: true },
  { path: "/estudiante/calificaciones", roles: ["student", "admin"], exact: true, requiresEnrollment: true },
  { path: "/simuladores", roles: ["student", "admin"], requiresEnrollment: true },
  { path: "/actividades", roles: ["student", "admin"], requiresEnrollment: true },
]

export const PUBLIC_ROUTES = new Set(["/login", "/auth/verificacion", "/auth/accion", "/auth/reset-password", "/unauthorized"])
