import { syllabus } from "./temario"

/**
 * Activities registry, the same shape as the simulators one: the catalog page
 * needs a title, a description and a topic tag, and those are presentation, not
 * evaluation. What each activity actually checks lives in the database, keyed by
 * this same `slug` — the lesson invokes it with `<!-- EJERCICIO: slug -->` and
 * the backend evaluates it against the student's environment.
 */
export interface Activity {
  slug: string
  title: string
  description: string
  topicNumber: number
  topicSlug: string
  topicTitle: string
  /** How many assertions the laboratory checks. */
  checks: number
  /** The lesson that holds the exercise. */
  href: string
}

const RAW = [
  {
    slug: "crear-directorio-practicas",
    title: "Crea tu primer directorio",
    description:
      "Arma tu carpeta de prácticas dentro del laboratorio y comprueba que quedó donde debe.",
    topicNumber: 3,
    subtopicId: "practica-directorios",
    checks: 2,
  },
  {
    slug: "universidad-facultades",
    title: "Construye una universidad",
    description:
      "Monta un árbol de directorios con tres facultades y el pensum de cada una, combinando mkdir y touch.",
    topicNumber: 4,
    subtopicId: "practica-universidad",
    checks: 7,
  },
]

export const activities: Activity[] = RAW.map((a) => {
  const topic = syllabus.find((t) => t.number === a.topicNumber)
  return {
    slug: a.slug,
    title: a.title,
    description: a.description,
    topicNumber: a.topicNumber,
    topicSlug: topic?.slug ?? "",
    topicTitle: topic?.title ?? "",
    checks: a.checks,
    href: `/group?tema=${topic?.slug ?? ""}&sub=${a.subtopicId}`,
  }
})

export function getActivities(): Activity[] {
  return activities
}

export function getActivity(slug: string): Activity | undefined {
  return activities.find((a) => a.slug === slug)
}
