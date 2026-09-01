import type { RouteRule } from "@/lib/models/content"

/* El material del curso es solo del estudiante.
 *
 * Un docente o un admin no lo ven ni escribiendo la ruta a mano: el temario, los
 * simuladores y las actividades se abren dando por hecho que hay matricula, y a
 * ellos les toca su propio panel. `/terminal` si la comparten los tres: es una
 * herramienta, no material, y el docente la usa para probar las actividades que
 * crea antes de asignarlas. */
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
  { path: "/contenidos", roles: ["student"], requiresEnrollment: true },
  { path: "/curso", roles: ["student"], exact: true, requiresEnrollment: true },
  { path: "/estudiante/grupo", roles: ["student"], exact: true, requiresEnrollment: true },
  { path: "/simuladores", roles: ["student"], requiresEnrollment: true },
  { path: "/actividades", roles: ["student"], requiresEnrollment: true },
]

export const PUBLIC_ROUTES = new Set(["/login", "/auth/verificacion", "/auth/accion", "/auth/reset-password", "/unauthorized"])
