export type ActivitySource = "bank" | "teacher"

export type Difficulty = "basic" | "intermediate" | "advanced"

export type EvaluationType = "atomic" | "manual"

export type GradingPolicy = "best_score" | "latest_score"

/** Taller: intentos ilimitados. Quiz: permite límite de intentos. */
export type ActivityType = "workshop" | "quiz"

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
export interface ActivitySubmissionStudent {
  studentId: string
  studentName: string
  studentEmail: string
  studentCode: string | null
  attemptsCount: number
  lastAttemptDate: string | null
  finalScore: number
  submissionId: string | null
}

export interface ManualSubmission {
  submissionId: string
  studentId: string
  studentName: string
  studentEmail: string
  studentCode: string | null
  status: string
  score: number | null
  submittedAt: string
  files: number
}

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
  activityType: ActivityType
  gradingPolicy?: GradingPolicy
  /** Límite de intentos; null o ausente = ilimitado. */
  attemptLimit?: number | null
  /** Habilita/deshabilita la actividad (publicar/deshabilitar). */
  enabled?: boolean
  /** Carpeta de trabajo autogenerada (`~/actividades/<workdir>/`). */
  workdir?: string
  checks: ActivityCheck[]
  uses?: number
  submissions?: ActivitySubmissionStudent[]
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
  /** Con al menos un intento o entrega la actividad queda completada (se conserva). */
  completed: boolean
  lastScore: number | null
  /** Número de evaluaciones registradas del estudiante. */
  attemptsCount: number
  /** Límite de intentos; null = ilimitado. */
  attemptLimit: number | null
  /** Nota final según la política configurada (0 si no hay intentos). */
  finalScore: number
  dueAt?: string | null
  enabled: boolean
  evaluationType: EvaluationType
  activityType: ActivityType
}

export interface MyGroupOverview {
  group: MyGroup | null
  activities: GroupActivitySummary[]
}

/** Detalle que ve el estudiante de una actividad de curso (sin criterios). */
export interface GroupActivityDetail {
  id: string
  groupId: string
  title: string
  instructions: string
  workdir: string
  dueAt: string | null
  evaluationType: EvaluationType
  activityType: ActivityType
  maxScore: number
  checksCount: number
  attemptLimit: number | null
  attemptsCount: number
  finalScore: number
  gradingPolicy: GradingPolicy
  enabled: boolean
  completed: boolean
  attempts: {
    attemptNumber: number
    createdAt: string
    score: number
  }[]
  lastAttempt: { passed: boolean; score: number } | null
  submission: {
    id: string
    status: string
    score: number | null
    feedback: string | null
    submittedAt: string
    files: number
  } | null
}

export interface GroupCheckOutcome {
  passed: boolean
  completed: boolean
  score: number
  finalScore: number
  attemptsCount: number
  attempts: GroupActivityDetail["attempts"]
  maxScore: number
  results: ActivityCheckResult[]
}

export interface SubmissionDetail {
  id: string
  status: "submitted" | "under_review" | "graded" | "returned"
  attemptNumber: number
  evidence: {
    storagePath: string
    tree: string[]
    files: number
    totalBytes: number
    submittedAt: string
  }
  score: number | null
  feedback: string | null
  gradedBy: string | null
  gradedAt: string | null
  submittedAt: string
  student: { id: string; name: string; email: string; code: string | null }
  activity: { id: string; title: string; maxScore: number }
}

export interface SubmissionGrade {
  id: string
  status: string
  score: number
  feedback: string | null
  gradedAt: string
}

export interface StudentActivityDetailManual {
  type: "manual"
  student: { id: string; name: string; email: string; code: string | null }
  activity: { id: string; title: string; workdir: string; evaluationType: string; activityType: string; maxScore: number }
  submission: {
    id: string
    status: string
    evidence: { storagePath: string; tree: string[]; files: number; totalBytes: number; submittedAt: string }
    score: number | null
    feedback: string | null
    gradedBy: string | null
    gradedAt: string | null
    submittedAt: string
  } | null
}

export interface StudentActivityDetailAutomatic {
  type: "automatic"
  student: { id: string; name: string; email: string; code: string | null }
  activity: { id: string; title: string; workdir: string; evaluationType: string; activityType: string; maxScore: number; gradingPolicy: string }
  attempts: {
    attemptNumber: number
    passed: boolean
    score: number
    results: { id: string; type: string; params: Record<string, unknown>; points: number; passed: boolean; detail: string }[]
    createdAt: string
  }[]
  finalScore: number
}

export type StudentActivityDetail = StudentActivityDetailManual | StudentActivityDetailAutomatic
