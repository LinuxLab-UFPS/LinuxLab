import { syllabus } from "./temario"

/**
 * Activities registry.
 *
 * An activity is NOT a lesson. Lessons carry *comprobaciones* — fixed checks
 * that measure progress and live inside a subtopic. An activity is a piece of
 * work on its own: it never appears in the course outline, it is opened next to
 * the terminal, and it is solved there. A topic can advertise one with a card,
 * but the card takes the student out to the terminal.
 *
 * This holds the presentation (title, difficulty, topic tag); what each activity
 * checks lives in the database, keyed by the same `slug`.
 */
export type Difficulty = "basic" | "intermediate" | "advanced"

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  basic: "Fácil",
  intermediate: "Intermedio",
  advanced: "Difícil",
}

export const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  basic: "border-emerald-500/40 text-emerald-500",
  intermediate: "border-amber-500/40 text-amber-500",
  advanced: "border-rose-500/40 text-rose-500",
}

export interface Activity {
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

const RAW = [
  {
    slug: "universidad-facultades",
    title: "Archivos y ficheros",
    description:
      "Levanta un árbol de facultades con el pensum de cada una.",
    difficulty: "basic" as Difficulty,
    topicNumber: 4,
    checks: 7,
  },
  {
    slug: "limpieza-con-comodines",
    title: "Limpieza con comodines",
    description:
      "Una carpeta con nueve archivos de tres tipos. Borra unos, reparte los otros.",
    difficulty: "basic" as Difficulty,
    topicNumber: 4,
    checks: 5,
  },
  {
    slug: "cada-archivo-en-su-sitio",
    title: "Cada archivo en su sitio",
    description:
      "Cuatro archivos llegaron con los permisos por defecto. Deja cada uno como pide su función.",
    difficulty: "basic" as Difficulty,
    topicNumber: 5,
    checks: 4,
  },
  {
    slug: "cerrar-el-proyecto",
    title: "Cerrar el proyecto",
    description:
      "Una carpeta a punto de entregarse. Revisa permisos de archivos y de directorios, y quita lo que sobra.",
    difficulty: "intermediate" as Difficulty,
    topicNumber: 5,
    checks: 5,
  },
  {
    slug: "mensaje-oculto",
    title: "El mensaje oculto",
    description:
      "Cuatro archivos de cien líneas esconden un dibujo por trozos. Reúnelos en el orden correcto.",
    difficulty: "intermediate" as Difficulty,
    topicNumber: 4,
    checks: 2,
  },
]

export const activities: Activity[] = RAW.map((a) => {
  const topic = syllabus.find((t) => t.number === a.topicNumber)
  return {
    ...a,
    topicSlug: topic?.slug ?? "",
    topicTitle: topic?.title ?? "",
    href: `/terminal?actividad=${a.slug}`,
  }
})

export function getActivities(): Activity[] {
  return activities
}

export function getActivity(slug: string): Activity | undefined {
  return activities.find((a) => a.slug === slug)
}

/** The activities a topic advertises, rendered as cards inside its lesson. */
export function getActivitiesForTopic(topicNumber: number): Activity[] {
  return activities.filter((a) => a.topicNumber === topicNumber)
}
