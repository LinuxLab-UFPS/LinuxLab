import type { RouteRule } from "@/lib/models/content"

/* Quien ve que.
 *
 * El **material de lectura** —el temario y los simuladores— lo comparten los
 * tres roles: el docente tiene que poder repasar lo que van a leer sus
 * estudiantes, y hasta ahora la unica forma era pedir prestada una cuenta. Entra
 * por la misma ruta de aprendizaje que ellos, que se dibuja sin cifras cuando
 * quien mira no cursa.
 *
 * Lo que sigue siendo **solo del estudiante** es lo que no existe sin matricula:
 * `/contenidos`, `/actividades` y `/estudiante/grupo` se abren dando por hecho
 * que hay un grupo detras, y a un docente le devolverian pantallas vacias.
 *
 * `requiresEnrollment` solo lo mira el middleware para estudiantes, asi que
 * dejarlo puesto en las rutas compartidas no le pide matricula a nadie mas.
 *
 * `/terminal` la comparten los tres desde siempre: es una herramienta, no
 * material, y el docente la usa para probar las actividades que crea. */
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
  { path: "/curso", roles: ["student", "teacher", "admin"], exact: true, requiresEnrollment: true },
  { path: "/estudiante/grupo", roles: ["student"], exact: true, requiresEnrollment: true },
  { path: "/simuladores", roles: ["student", "teacher", "admin"], requiresEnrollment: true },
  { path: "/actividades", roles: ["student"], requiresEnrollment: true },
]

export const PUBLIC_ROUTES = new Set(["/login", "/auth/verificacion", "/auth/accion", "/auth/reset-password", "/unauthorized"])
