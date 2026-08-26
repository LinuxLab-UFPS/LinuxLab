import type { TagTone } from "@shared/components/tag"
import { syllabus } from "./temario"
import type { ActivityListing, Difficulty } from "@/lib/models/activities"

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
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  basic: "Fácil",
  intermediate: "Intermedio",
  advanced: "Difícil",
}

/**
 * El color de la dificultad. Es el unico tag de una tarjeta que lo lleva: dice
 * algo del contenido, mientras que el tema y las comprobaciones son datos y van
 * en neutro. Antes eran fragmentos de borde y ahora son tonos del `Tag` comun.
 */
export const DIFFICULTY_TONE: Record<Difficulty, TagTone> = {
  basic: "emerald",
  intermediate: "amber",
  advanced: "rose",
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
    slug: "limpieza",
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
      "El empleado anterior dejó cinco archivos con los permisos incorrectos. Deja cada uno como pide su función.",
    difficulty: "basic" as Difficulty,
    topicNumber: 5,
    checks: 5,
  },
  {
    slug: "permisos-por-escrito",
    title: "Permisos por escrito",
    description:
      "Un colega no sabe cambiar permisos. Escríbelos por él, en notación simbólica.",
    difficulty: "intermediate" as Difficulty,
    topicNumber: 5,
    checks: 3,
  },
  {
    slug: "mensaje-oculto",
    title: "Arma el logo",
    description:
      "El logo está repartido en cuatro archivos de cien líneas. Saca cada trozo y júntalos en orden.",
    difficulty: "intermediate" as Difficulty,
    topicNumber: 4,
    checks: 2,
  },
  {
    slug: "paquete-de-entrega",
    title: "El paquete de entrega",
    description:
      "Empaqueta el informe en un .tar.gz, deja por escrito qué trae dentro y comprueba que abre.",
    difficulty: "intermediate" as Difficulty,
    topicNumber: 6,
    checks: 5,
  },
  {
    slug: "logs-servicio1",
    title: "El rastro en los registros",
    description:
      "Tres bitácoras y una sola línea que importa. Sácala con grep y cuenta los avisos.",
    difficulty: "basic" as Difficulty,
    topicNumber: 7,
    checks: 2,
  },
  {
    slug: "el-arbol-del-proyecto",
    title: "El árbol del proyecto",
    description:
      "Qué configuraciones hay, cuánto ocupan las bitácoras y qué servicio falla más.",
    difficulty: "intermediate" as Difficulty,
    topicNumber: 7,
    checks: 4,
  },
  {
    slug: "tu-ficha-de-identidad",
    title: "Tu ficha de identidad",
    description:
      "Deja por escrito quién eres para el sistema, de qué archivo sale y con qué shell entras.",
    difficulty: "basic" as Difficulty,
    topicNumber: 8,
    checks: 4,
  },
  {
    slug: "la-carpeta-del-equipo",
    title: "La carpeta del equipo",
    description:
      "Monta una carpeta compartida con setgid para que lo que nazca dentro herede el grupo.",
    difficulty: "intermediate" as Difficulty,
    topicNumber: 8,
    checks: 4,
  },
  {
    slug: "foto-del-sistema",
    title: "La foto del sistema",
    description:
      "Captura lo que corre en tu cuenta y averigua el nombre de las dos señales de cierre.",
    difficulty: "basic" as Difficulty,
    topicNumber: 9,
    checks: 4,
  },
  {
    slug: "el-turno-de-noche",
    title: "El turno de noche",
    description:
      "Tres tareas en segundo plano, apunta cuáles son, cierra una y cuenta las que quedan.",
    difficulty: "intermediate" as Difficulty,
    topicNumber: 9,
    checks: 3,
  },
  {
    slug: "tu-primer-guion",
    title: "Tu primer guion",
    description:
      "Un script con cabecera y permiso de ejecución que al correr deja tu código escrito.",
    difficulty: "basic" as Difficulty,
    topicNumber: 10,
    checks: 4,
  },
  {
    slug: "el-guion-que-decide",
    title: "El guion que decide",
    description:
      "Un ciclo que recorre las bitácoras y un condicional que decide si hay que revisar.",
    difficulty: "intermediate" as Difficulty,
    topicNumber: 10,
    checks: 7,
  },
]

export const activities: ActivityListing[] = RAW.map((a) => {
  const topic = syllabus.find((t) => t.number === a.topicNumber)
  return {
    ...a,
    topicSlug: topic?.slug ?? "",
    topicTitle: topic?.title ?? "",
    href: `/terminal?actividad=${a.slug}`,
  }
})

export function getActivities(): ActivityListing[] {
  return activities
}

export function getActivity(slug: string): ActivityListing | undefined {
  return activities.find((a) => a.slug === slug)
}

/** The activities a topic advertises, rendered as cards inside its lesson. */
export function getActivitiesForTopic(topicNumber: number): ActivityListing[] {
  return activities.filter((a) => a.topicNumber === topicNumber)
}
