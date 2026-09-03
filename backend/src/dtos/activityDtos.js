const { z } = require("zod")

/**
 * Configuracion comun de una actividad de grupo, validada con zod antes de la
 * logica de negocio. Las aserciones (checks) no viven aqui: su validacion
 * depende del catalogo dinamico (checkCatalog) y del puntaje repartido, y la
 * hace buildChecks en el servicio.
 */
const activityInputSchema = z.object({
  title: z
    .string({
      required_error: "El nombre de la actividad es requerido",
      invalid_type_error: "El nombre de la actividad es requerido",
    })
    .trim()
    .min(1, "El nombre de la actividad es requerido")
    .max(255, "El nombre de la actividad no puede superar los 255 caracteres"),
  instructions: z
    .string()
    .trim()
    .max(2000, "La descripción no puede superar los 2000 caracteres")
    .optional()
    .nullable(),
  // null o ausente = intentos ilimitados; un entero positivo = límite.
  attemptLimit: z.number().int().positive().nullable().optional(),
  // La misma escala del temario: el docente clasifica su actividad para que
  // conviva con las del curso en los listados y filtros del estudiante.
  difficulty: z.enum(["basic", "intermediate", "advanced"]).default("basic"),
  activityType: z.enum(["workshop", "quiz"]).default("workshop"),
  // "atomic" es una alias historico de "automatic" (lo normaliza el servicio).
  evaluationType: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  topicNumber: z.union([z.number(), z.string()]).optional(),
  checks: z.array(z.unknown()).optional(),
})

/**
 * Prefijo del id de una actividad del temario cuando viaja por rutas pensadas
 * para las del docente.
 *
 * Las del docente se resuelven por uuid y las del temario por slug, pero ambas
 * pasan por el mismo `:activityId`. El prefijo dice de que tabla sale sin tener
 * que consultar las dos. Doble guion y no dos puntos: un `:` dentro de un
 * segmento de ruta es terreno resbaladizo.
 */
const BANK_PREFIX = "bank--"

/** El id compuesto con el que una actividad del temario viaja al frontend. */
function bankActivityId(slug) {
  return `${BANK_PREFIX}${slug}`
}

/** El slug si el id es de una del temario; null si es de una del docente. */
function bankSlugOf(activityId) {
  if (typeof activityId !== "string" || !activityId.startsWith(BANK_PREFIX)) return null
  return activityId.slice(BANK_PREFIX.length) || null
}

/**
 * La unica actividad del temario cuyo trabajo NO vive en `~/actividades/<slug>`.
 *
 * Monta su arbol en la carpeta personal a proposito, y sus comprobaciones
 * apuntan alli. Sin `workdir` la interfaz no ofrece ni "ir a la carpeta" (seria
 * una carpeta vacia) ni reiniciar (borraria algo que no es suyo).
 */
const SIN_CARPETA_PROPIA = new Set(["universidad-facultades"])

/** La carpeta de trabajo de una actividad del temario, o null si no tiene. */
function workdirOf(slug) {
  return SIN_CARPETA_PROPIA.has(slug) ? null : slug
}

/**
 * Una actividad del temario con la misma forma que una del docente.
 *
 * Las del temario no tienen fecha de entrega, ni limite de intentos, ni se
 * pueden deshabilitar: son el curso, iguales en todos los grupos. Los campos que
 * no existen se rellenan con el valor que las describe, no con un hueco, para
 * que las vistas del docente no tengan que preguntar de donde salio cada fila.
 */
function serializeTopicActivity(ta) {
  return {
    id: bankActivityId(ta.slug),
    slug: ta.slug,
    title: ta.title,
    topicNumber: ta.topic?.order_number ?? 0,
    source: "bank",
    difficulty: ta.difficulty,
    instructions: ta.instructions ?? "",
    maxScore: 100,
    dueDate: null,
    required: true,
    evaluationType: "atomic",
    // Ni taller ni quiz: esa division es de las del docente. Las del temario se
    // clasifican por dificultad, y la interfaz pinta una u otra segun `source`.
    activityType: null,
    attemptLimit: null,
    workdir: workdirOf(ta.slug),
    enabled: true,
    checks: (ta.checks ?? []).map((c) => ({
      id: c.id,
      type: c.type,
      params: c.params,
      points: c.points,
    })),
    uses: 0,
  }
}

/** La forma que espera el frontend para la tabla de actividades de un curso. */
function serializeGroupActivity(ga) {
  return {
    id: ga.id,
    title: ga.title,
    topicNumber: ga.topic_number ?? 0,
    source: "teacher",
    difficulty: ga.difficulty ?? "basic",
    instructions: ga.instructions ?? "",
    maxScore: ga.max_score,
    dueDate: ga.due_at?.toISOString(),
    required: ga.required,
    evaluationType: ga.evaluation_type === "manual" ? "manual" : "atomic",
    activityType: ga.activity_type === "quiz" ? "quiz" : "workshop",
    attemptLimit: ga.attempt_limit,
    workdir: ga.workdir,
    enabled: ga.enabled,
    checks: (ga.checks ?? []).map((c) => ({
      id: c.id,
      type: c.type,
      params: c.params,
      points: c.points,
    })),
    uses: 0,
  }
}

module.exports = {
  activityInputSchema,
  serializeGroupActivity,
  serializeTopicActivity,
  bankActivityId,
  bankSlugOf,
  workdirOf,
}
