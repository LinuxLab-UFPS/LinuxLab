import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { TopicContentMeta } from "@/lib/models/content"
import { env } from "@/lib/config/env"
import { syllabus } from "./temario"
import { bienvenida } from "./bienvenida"
import { getSimulators } from "./simulators"
import { getActivities, getActivitiesForTopic } from "./activities"

/**
 * Content seam (server-only, reads from disk).
 *
 * Lesson material lives under `content/temario/tema-NN/`: a `meta.json` manifest
 * plus one markdown file per subtopic. Their images live under
 * `public/temario/tema-NN/` so Next can serve them statically.
 *
 * Most topics have no content yet, in which case these return null and the UI
 * shows an empty state. Drop a `tema-NN` directory in to publish a topic. No
 * code changes needed.
 */

const CONTENT_ROOT = join(process.cwd(), "content", "temario")
const ASSET_ROOT = join(process.cwd(), "public", "temario")

function topicDir(topicNumber: number): string {
  return `tema-${String(topicNumber).padStart(2, "0")}`
}

export function getTopicContentMeta(topicNumber: number): TopicContentMeta | null {
  try {
    const raw = readFileSync(join(CONTENT_ROOT, topicDir(topicNumber), "meta.json"), "utf8")
    return JSON.parse(raw) as TopicContentMeta
  } catch {
    return null
  }
}

/**
 * El markdown de la seccion de bienvenida.
 *
 * Carpeta aparte de `temario/`: la bienvenida no es un tema y no tiene numero
 * con el que construir `tema-NN` (ver shared/lib/content/bienvenida.ts).
 */
export function getBienvenidaMarkdown(file: string): string | null {
  try {
    return readFileSync(join(process.cwd(), "content", "bienvenida", file), "utf8")
  } catch {
    return null
  }
}

export function getSubtopicMarkdown(topicNumber: number, file: string): string | null {
  try {
    return readFileSync(join(CONTENT_ROOT, topicDir(topicNumber), file), "utf8")
  } catch {
    return null
  }
}

export function hasTopicContent(topicNumber: number): boolean {
  return getTopicContentMeta(topicNumber) !== null
}

/** Public URL of a lesson image, e.g. "/temario/tema-01/tux-evolution.png". */
export function lessonAssetUrl(topicNumber: number, file: string): string {
  return `/temario/${topicDir(topicNumber)}/${file}`
}

/** Whether the image file has actually been added to public/temario/tema-NN/. */
export function lessonAssetExists(topicNumber: number, file: string): boolean {
  return existsSync(join(ASSET_ROOT, topicDir(topicNumber), file))
}

/**
 * Public URL of a lesson video. Videos are hosted on Cloudflare R2 (they are too
 * heavy for the repo, see .gitignore) under the same tema-NN/file layout as
 * local assets. Falls back to the local public/temario path when the CDN base
 * isn't configured, so videos dropped locally still work in dev.
 */
export function lessonVideoUrl(topicNumber: number, file: string): string {
  if (env.videoBaseUrl) return `${env.videoBaseUrl}/${topicDir(topicNumber)}/${file}`
  return lessonAssetUrl(topicNumber, file)
}

/**
 * Whether the video is available: trusts the CDN when configured (no cheap way
 * to check a remote file's existence at request time), otherwise checks the
 * local file like other assets.
 */
export function lessonVideoExists(topicNumber: number, file: string): boolean {
  if (env.videoBaseUrl) return true
  return lessonAssetExists(topicNumber, file)
}

/** One step of the course in reading order: a subtopic, or a whole topic if it has no content yet. */
export interface LessonRef {
  topicNumber: number
  topicSlug: string
  topicTitle: string
  /** null when the topic has no published content (the step is the topic itself). */
  subtopicId: string | null
  subtopicTitle: string | null
  href: string
  isSimulator?: boolean
}

/**
 * The whole course flattened in temario order. A topic with content contributes
 * one step per subtopic; a topic without content still contributes one step, so
 * "Siguiente" keeps advancing from tema 1 → tema 2 → … instead of dead-ending.
 */
export function getLessonSequence(): LessonRef[] {
  const refs: LessonRef[] = []
  for (const topic of syllabus) {
    const meta = getTopicContentMeta(topic.number)
    const base = {
      topicNumber: topic.number,
      topicSlug: topic.slug,
      topicTitle: topic.title,
    }

    if (!meta || meta.subtopics.length === 0) {
      refs.push({
        ...base,
        subtopicId: null,
        subtopicTitle: null,
        href: `/curso?tema=${topic.slug}`,
      })
      continue
    }

    for (const sub of meta.subtopics) {
      refs.push({
        ...base,
        subtopicId: sub.id,
        subtopicTitle: sub.title,
        href: `/curso?tema=${topic.slug}&sub=${sub.id}`,
        isSimulator: sub.type === "simulator",
      })
    }
  }
  return refs
}

export interface TopicLessons {
  /** Subtopic ids, in temario order. */
  ids: string[]
  /** Subtopic id -> slug of the check it carries, only for the ones with one. */
  checks: Record<string, string>
}

const EJERCICIO_DIRECTIVE = /<!--\s*EJERCICIO\s*:\s*([a-z0-9-]+)\s*-->/i

/**
 * The lessons of each topic and which of them carry a check.
 *
 * Progress needs both: a plain lesson is done once it has been read, but one
 * with a check is only done when the check passes. Topics without published
 * content are absent, so the UI can skip their progress bar.
 */
export function getTopicLessons(): Record<number, TopicLessons> {
  const lessons: Record<number, TopicLessons> = {}
  for (const topic of syllabus) {
    const meta = getTopicContentMeta(topic.number)
    if (!meta || meta.subtopics.length === 0) continue

    const checks: Record<string, string> = {}
    for (const sub of meta.subtopics) {
      const match = getSubtopicMarkdown(topic.number, sub.file)?.match(EJERCICIO_DIRECTIVE)
      if (match) checks[sub.id] = match[1]
    }

    lessons[topic.number] = { ids: meta.subtopics.map((sub) => sub.id), checks }
  }
  return lessons
}

/** A "sneak peek" of what a topic holds, used by the content cards. */
export interface TopicPreview {
  /** Estimated reading time in minutes. */
  minutes: number
  videos: number
  simulators: number
  activities: number
}

const VIDEO_DIRECTIVE = /<!--\s*VIDEO\s*:/gi
const SIMULATOR_DIRECTIVE = /<!--\s*SIMULATOR\s*:/gi
const WORDS_PER_MINUTE = 200

/**
 * Per-topic preview stats: reading time, and how many videos, simulators and
 * activities the topic has. All four are counted, never written down — adding an
 * activity to the registry or a video directive to a lesson moves the number on
 * its own.
 *
 * A topic with nothing published contributes no entry, so its card shows no tags.
 */
export function getTopicPreviews(): Record<number, TopicPreview> {
  const previews: Record<number, TopicPreview> = {}
  for (const topic of syllabus) {
    const activities = getActivitiesForTopic(topic.number).length
    const meta = getTopicContentMeta(topic.number)
    // Un tema puede anunciar una actividad antes de tener lecciones escritas.
    if (!meta && activities === 0) continue

    let words = 0
    let videos = 0
    let simulators = 0
    for (const sub of meta?.subtopics ?? []) {
      const md = getSubtopicMarkdown(topic.number, sub.file)
      if (!md) continue
      words += md.split(/\s+/).filter(Boolean).length
      videos += (md.match(VIDEO_DIRECTIVE) ?? []).length
      simulators += (md.match(SIMULATOR_DIRECTIVE) ?? []).length
    }

    previews[topic.number] = {
      minutes: words > 0 ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0,
      videos,
      simulators,
      activities,
    }
  }
  return previews
}

/** Previous/next step around the given position. */
export function getLessonNeighbours(
  topicNumber: number,
  subtopicId: string | null,
): { prev: LessonRef | null; next: LessonRef | null } {
  const sequence = getLessonSequence()
  const i = sequence.findIndex(
    (r) => r.topicNumber === topicNumber && r.subtopicId === subtopicId,
  )
  if (i === -1) return { prev: null, next: null }
  return {
    prev: sequence[i - 1] ?? null,
    next: sequence[i + 1] ?? null,
  }
}

/** A searchable item: a module (lesson), a subtopic, a simulator or an activity. */
export interface SearchItem {
  title: string
  kind: "modulo" | "subtema" | "simulador" | "actividad"
  /** Right-side type label: Módulo, Tema, Simulador or Actividad. */
  context: string
  href: string
}

/** Everything the header search can find: the lessons (modules), the subtopics
 *  of topics with published content, and every simulator and activity in their
 *  registries — adding one there puts it in the search with no further work. */
export function getSearchIndex(): SearchItem[] {
  const items: SearchItem[] = []

  // La bienvenida tambien se busca: es la unica seccion fuera del temario y sin
  // esto seria la unica pagina del curso imposible de encontrar.
  for (const pagina of bienvenida.pages) {
    items.push({
      title: pagina.title,
      kind: "subtema",
      context: bienvenida.title,
      href: `/curso?tema=${bienvenida.slug}&sub=${pagina.id}`,
    })
  }

  for (const topic of syllabus) {
    // The lesson (module) itself.
    items.push({
      title: topic.title,
      kind: "modulo",
      context: "Módulo",
      href: `/curso?tema=${topic.slug}`,
    })

    const meta = getTopicContentMeta(topic.number)
    if (!meta) continue
    for (const sub of meta.subtopics) {
      items.push({
        title: sub.title,
        kind: "subtema",
        context: "Tema",
        href: `/curso?tema=${topic.slug}&sub=${sub.id}`,
      })
    }
  }

  // Neither simulators nor activities are course subtopics: they come from
  // their own registries.
  for (const sim of getSimulators()) {
    items.push({
      title: sim.title,
      kind: "simulador",
      context: "Simulador",
      href: sim.href,
    })
  }

  for (const activity of getActivities()) {
    items.push({
      title: activity.title,
      kind: "actividad",
      context: "Actividad",
      href: activity.href,
    })
  }

  return items
}
