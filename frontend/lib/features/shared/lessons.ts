import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { TopicContentMeta } from "@/lib/features/shared/types"
import { env } from "@/lib/config/env"
import { syllabus } from "./temario"
import { getSimulators } from "./simulators"
import { getActivities } from "./activities"

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
        href: `/group?tema=${topic.slug}`,
      })
      continue
    }

    for (const sub of meta.subtopics) {
      refs.push({
        ...base,
        subtopicId: sub.id,
        subtopicTitle: sub.title,
        href: `/group?tema=${topic.slug}&sub=${sub.id}`,
        isSimulator: sub.type === "simulator",
      })
    }
  }
  return refs
}

/**
 * How many lessons each topic has, keyed by topic number. Topics without
 * published content are absent, so the UI can skip their progress bar.
 */
export function getTopicLessonCounts(): Record<number, number> {
  const counts: Record<number, number> = {}
  for (const topic of syllabus) {
    const meta = getTopicContentMeta(topic.number)
    if (meta && meta.subtopics.length > 0) counts[topic.number] = meta.subtopics.length
  }
  return counts
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
 * Per-topic preview stats (reading time + how many videos, simulators and
 * activities are inside). Topics without published content are omitted, so their
 * cards show no tags. Activities are not wired to topics yet, so that count stays
 * at zero until they are.
 */
export function getTopicPreviews(): Record<number, TopicPreview> {
  const previews: Record<number, TopicPreview> = {}
  for (const topic of syllabus) {
    const meta = getTopicContentMeta(topic.number)
    if (!meta) continue

    let words = 0
    let videos = 0
    let simulators = 0
    for (const sub of meta.subtopics) {
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
      activities: 0,
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
  for (const topic of syllabus) {
    // The lesson (module) itself.
    items.push({
      title: topic.title,
      kind: "modulo",
      context: "Módulo",
      href: `/group?tema=${topic.slug}`,
    })

    const meta = getTopicContentMeta(topic.number)
    if (!meta) continue
    for (const sub of meta.subtopics) {
      items.push({
        title: sub.title,
        kind: "subtema",
        context: "Tema",
        href: `/group?tema=${topic.slug}&sub=${sub.id}`,
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
