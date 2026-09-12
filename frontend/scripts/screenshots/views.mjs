/**
 * Catalogo de vistas por iteracion, tomado de la seccion "Vistas
 * implementadas" de cada SRS. `role: null` = pagina publica, se captura sin
 * cookie de sesion.
 */
export function buildViews(auth) {
  const g = auth.groupId
  const a = auth.activityId
  const c = auth.certCode
  const t = auth.inviteToken

  return [
    // Iteracion 1 - Acceso y gestion de usuarios
    { iteration: 1, name: "login", path: "/login", role: null },
    { iteration: 1, name: "auth-verificacion", path: "/auth/verificacion", role: null },
    { iteration: 1, name: "auth-reset-password", path: "/auth/reset-password", role: null },
    { iteration: 1, name: "auth-accion", path: "/auth/accion", role: null },
    { iteration: 1, name: "auth-setup-account", path: "/auth/setup-account", role: null },
    { iteration: 1, name: "unauthorized", path: "/unauthorized", role: null },
    { iteration: 1, name: "admin-docentes", path: "/admin/docentes", role: "admin" },

    // Iteracion 2 - Contenido academico y entorno Linux
    { iteration: 2, name: "inicio", path: "/inicio", role: "student" },
    { iteration: 2, name: "curso", path: "/curso", role: "student" },
    { iteration: 2, name: "simuladores", path: "/simuladores", role: "student" },
    { iteration: 2, name: "simulador-detalle", path: "/simuladores/travesia-del-arbol", role: "student" },
    { iteration: 2, name: "terminal", path: "/terminal", role: "student" },

    // Iteracion 3 - Gestion docente y grupos
    { iteration: 3, name: "inicio-docente", path: "/inicio", role: "teacher" },
    { iteration: 3, name: "grupos-crear", path: "/grupos/crear", role: "teacher" },
    { iteration: 3, name: "grupo-detalle", path: `/grupos/${g}`, role: "teacher" },
    { iteration: 3, name: "grupo-editar", path: `/grupos/${g}/editar`, role: "teacher" },
    { iteration: 3, name: "estudiante-grupo", path: "/estudiante/grupo", role: "student" },
    { iteration: 3, name: "inscripcion", path: `/inscripcion?token=${t}&group=${g}`, role: null },
    { iteration: 3, name: "inscripcion-pendiente", path: "/inscripcion/pendiente", role: "student" },

    // Iteracion 4 - Actividades y evaluacion
    { iteration: 4, name: "actividades", path: "/actividades", role: "student" },
    { iteration: 4, name: "grupo-actividad", path: `/grupos/${g}/actividades/${a}`, role: "teacher" },

    // Iteracion 5 - Seguimiento, auditoria y cierre
    { iteration: 5, name: "grupo-finalizar", path: `/grupos/${g}/finalizar`, role: "teacher" },
    { iteration: 5, name: "admin-bitacora", path: "/admin/bitacora", role: "admin" },
    { iteration: 5, name: "verificar-certificado", path: `/verificar/${c}`, role: null },
  ].filter((v) => v.path && !v.path.includes("undefined") && !v.path.includes("null"))
}
