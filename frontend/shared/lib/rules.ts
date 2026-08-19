import type { RouteRule } from "@/lib/models/content"

/**
 * Tabla central de rutas protegidas: un solo lugar donde se decide que roles
 * pueden entrar a cada ruta. La usan el middleware edge y los guardas de las
 * paginas.
 */
export const ROUTE_RULES: RouteRule[] = [
  { path: "/home", roles: ["student", "teacher", "admin"], exact: true },
  { path: "/admin", roles: ["admin"] },
  { path: "/audit-log", roles: ["admin", "teacher"], exact: true },
  { path: "/groups", roles: ["teacher", "admin"] },
  { path: "/create-group", roles: ["teacher", "admin"], exact: true },
  { path: "/terminal", roles: ["student", "teacher", "admin"], exact: true },
  { path: "/contents", roles: ["student", "admin"] },
  { path: "/group", roles: ["student", "teacher", "admin"], exact: true },
  { path: "/mi-grupo", roles: ["student", "admin"], exact: true },
  { path: "/mis-calificaciones", roles: ["student", "admin"], exact: true },
  { path: "/simulators", roles: ["student", "admin"] },
  { path: "/activities", roles: ["student", "admin"] },
]
