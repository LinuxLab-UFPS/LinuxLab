export type ActivitySource = "bank" | "teacher"

export type Difficulty = "basic" | "intermediate" | "advanced"

export type EvaluationType = "atomic" | "manual"

export type GradingPolicy = "best_score" | "latest_score"

/** Un campo de formulario de una asercion del catalogo. */
export interface CatalogField {
  key: string
  label: string
  placeholder?: string
}

/** Una asercion del catalogo, servida por GET /api/activities/catalog. */
export interface CatalogEntry {
  type: string
  label: string
  hint: string
  fields: CatalogField[]
}

export interface ActivityCheck {
  id: string
  type: string
  params: Record<string, string>
  points: number
}

/** Resultado de una asercion tras evaluar (linea base y de curso, misma forma). */
export interface ActivityCheckResult {
  id: string
  type: string
  params: Record<string, string>
  points: number
  passed: boolean
  detail: string
}

/**
 * Actividad del temario (comprobacion de una leccion): la que el estudiante
 * abre junto a la terminal. GET /api/activities/:slug devuelve esto con su
 * ultimo intento.
 */
export interface LessonActivity {
  slug: string
  /** La actividad prepara archivos y por tanto se pueden rehacer. */
  hasSetup: boolean
  title: string
  instructions: string | null
  maxScore: number
  checks: ActivityCheck[]
  lastAttempt: { passed: boolean; score: number; results: ActivityCheckResult[]; at: string } | null
}

/**
 * Actividad de curso (GroupActivity): el snapshot que el docente publica en su
 * grupo. Es la misma forma para el CRUD del docente y para el listado.
 */
export interface Activity {
  id: string
  title: string
  topicNumber: number
  source: ActivitySource
  difficulty?: Difficulty
  instructions: string
  maxScore: number
  dueDate?: string
  required: boolean
  evaluationType: EvaluationType
  gradingPolicy?: GradingPolicy
  /** Carpeta de trabajo autogenerada (`~/actividades/<workdir>/`). */
  workdir?: string
  checks: ActivityCheck[]
  uses?: number
}

export type CreateActivityInput = Omit<Activity, "id" | "uses">

/** Tarjeta de actividad en el temario (registro de presentacion, no DTO). */
export interface ActivityListing {
  slug: string
  title: string
  description: string
  /** Opcional: las actividades de curso no declaran dificultad. */
  difficulty?: Difficulty
  topicNumber: number
  topicSlug: string
  topicTitle: string
  /** How many assertions the laboratory checks. */
  checks: number
  /** Activities are always solved next to the terminal, never inside a lesson. */
  href: string
  /** Solo las de curso lo traen; las del temario lo decide el registro local. */
  completed?: boolean
}

export interface MyGroup {
  id: string
  name: string
  description: string
  teacherName: string
}

export interface GroupActivitySummary {
  id: string
  title: string
  description: string
  topicNumber: number
  checksCount: number
  passed: boolean
  lastScore: number | null
}

export interface MyGroupOverview {
  group: MyGroup | null
  activities: GroupActivitySummary[]
}

/** Detalle que ve el estudiante de una actividad de curso (sin criterios). */
export interface GroupActivityDetail {
  id: string
  title: string
  instructions: string
  workdir: string
  dueAt: string | null
  evaluationType: EvaluationType
  maxScore: number
  checksCount: number
  lastAttempt: { passed: boolean; score: number } | null
}

export interface GroupCheckOutcome {
  passed: boolean
  score: number
  maxScore: number
  results: ActivityCheckResult[]
}
