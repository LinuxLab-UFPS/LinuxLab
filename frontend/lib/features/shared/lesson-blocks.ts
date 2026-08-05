import { lessonAssetExists, lessonAssetUrl, lessonVideoExists, lessonVideoUrl } from "./lessons"

/**
 * Media directives inside lesson markdown, written as HTML comments so the raw
 * files stay readable:
 *
 *   <!-- IMAGE: archivo.png | texto alternativo -->
 *   <!-- IMAGE-DARK: logo-dark.png | ... -->      (par: se muestra en tema oscuro)
 *   <!-- IMAGE-LIGHT: logo-light.png | ... -->    (par: se muestra en tema claro)
 *   <!-- VIDEO: id-del-video | título -->
 *   <!-- ILLUSTRATION: gui-cli -->                (ver lesson-illustrations.tsx)
 *   <!-- EJERCICIO: slug -->                      (comprobacion evaluada en el entorno)
 *   <!-- ACTIVIDAD: slug -->                      (tarjeta que lleva a la terminal)
 *
 * Images and videos are served from `public/temario/tema-NN/`. A directive whose
 * file is not there yet renders a "pendiente" placeholder instead of breaking.
 *
 * Code fences are also handled here: a ```bash block becomes a terminal window,
 * and a plain ``` block written immediately after it is folded in as that
 * command's output (they are one terminal session, not two). Plain blocks that
 * do NOT follow a command (ASCII diagrams, quoted text) stay ordinary code
 * blocks.
 */

export type LessonBlock =
  | { kind: "markdown"; content: string }
  | { kind: "sources"; content: string }
  | { kind: "terminal"; command: string; output?: string }
  | { kind: "image"; src: string; alt: string; exists: boolean; expectedPath: string }
  | {
      kind: "image-theme"
      lightSrc: string
      darkSrc: string
      alt: string
      exists: boolean
      expectedPaths: string[]
    }
  | { kind: "video"; title: string; src: string; exists: boolean; expectedPath: string }
  | { kind: "simulator"; src: string }
  | { kind: "simulator-card"; id: string }
  | { kind: "fs-tree" }
  | { kind: "illustration"; id: string }
  | { kind: "exercise"; slug: string }
  | { kind: "activity"; slug: string }

interface Directive {
  type: string
  value: string
  label: string
}

type Token =
  | { kind: "markdown"; content: string }
  | { kind: "directive"; directive: Directive }

const DIRECTIVE_RE =
  /<!--\s*(IMAGE-DARK|IMAGE-LIGHT|IMAGE|VIDEO|SIMULATOR|FS-TREE|ILLUSTRATION|EJERCICIO|ACTIVIDAD)\s*(?::\s*([^|\s][^|]*?)\s*(?:\|\s*(.*?)\s*)?)?-->/g

const FENCE_RE = /```([a-zA-Z0-9]*)[ \t]*\r?\n([\s\S]*?)```/g

/**
 * The bibliography every lesson closes with, written as an optional `---` rule
 * followed by `**Sources**` and a list. It is pulled out of the body so it can be
 * rendered as a collapsed disclosure instead of a wall of citations between the
 * lesson and the "Next" button.
 */
const SOURCES_RE = /\n+(?:---[ \t]*\n+)?\*\*(?:Fuentes|Sources)\*\*[ \t]*\n+([\s\S]*)$/

/** Languages we render as a terminal window. */
const TERMINAL_LANGS = new Set(["bash", "sh", "shell", "zsh", "console"])

interface Fence {
  start: number
  end: number
  lang: string
  code: string
}

/**
 * Split a markdown chunk into markdown + terminal blocks. Command fences become
 * terminals; an unlabelled fence directly after one is folded in as its output.
 */
function splitTerminals(chunk: string): LessonBlock[] {
  const fences: Fence[] = []
  for (const m of chunk.matchAll(FENCE_RE)) {
    const start = m.index ?? 0
    fences.push({
      start,
      end: start + m[0].length,
      lang: m[1].toLowerCase(),
      code: m[2].replace(/\r?\n$/, ""),
    })
  }
  if (fences.length === 0) {
    return chunk.trim() ? [{ kind: "markdown", content: chunk }] : []
  }

  const blocks: LessonBlock[] = []
  let buffer = ""
  let cursor = 0

  const flush = () => {
    if (buffer.trim()) blocks.push({ kind: "markdown", content: buffer })
    buffer = ""
  }

  for (let i = 0; i < fences.length; i++) {
    const fence = fences[i]
    buffer += chunk.slice(cursor, fence.start)
    cursor = fence.end

    if (!TERMINAL_LANGS.has(fence.lang)) {
      // Not a command: leave it in the markdown so it renders as a code block.
      buffer += chunk.slice(fence.start, fence.end)
      continue
    }

    flush()

    // Fold in the next fence as output when it is unlabelled and adjacent.
    let output: string | undefined
    const next = fences[i + 1]
    if (next && next.lang === "" && chunk.slice(fence.end, next.start).trim() === "") {
      output = next.code
      cursor = next.end
      i++
    }

    blocks.push({ kind: "terminal", command: fence.code, output })
  }

  buffer += chunk.slice(cursor)
  flush()
  return blocks
}

/** Find the complementary IMAGE-DARK/IMAGE-LIGHT directive, allowing blank text between. */
function findPartner(
  tokens: Token[],
  from: number,
  type: string,
): { directive: Directive; index: number } | null {
  const want = type === "IMAGE-DARK" ? "IMAGE-LIGHT" : "IMAGE-DARK"
  for (let j = from + 1; j < tokens.length; j++) {
    const token = tokens[j]
    if (token.kind === "markdown") {
      if (token.content.trim()) return null
      continue
    }
    return token.directive.type === want
      ? { directive: token.directive, index: j }
      : null
  }
  return null
}

export function parseLessonBlocks(markdown: string, topicNumber: number): LessonBlock[] {
  // 0. Peel the bibliography off the end; it is rendered as a disclosure.
  let body = markdown
  let sources: string | null = null
  const sourcesMatch = markdown.match(SOURCES_RE)
  if (sourcesMatch && sourcesMatch.index !== undefined) {
    sources = sourcesMatch[1].trim()
    body = markdown.slice(0, sourcesMatch.index).trimEnd()
  }

  // 1. Split the markdown around the media directives.
  const tokens: Token[] = []
  let cursor = 0
  for (const match of body.matchAll(DIRECTIVE_RE)) {
    const start = match.index ?? 0
    if (start > cursor) {
      tokens.push({ kind: "markdown", content: body.slice(cursor, start) })
    }
    tokens.push({
      kind: "directive",
      directive: {
        type: match[1],
        value: (match[2] ?? "").trim(),
        label: (match[3] ?? "").trim(),
      },
    })
    cursor = start + match[0].length
  }
  if (cursor < body.length) {
    tokens.push({ kind: "markdown", content: body.slice(cursor) })
  }

  // 2. Turn tokens into blocks, pairing dark/light images.
  const blocks: LessonBlock[] = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.kind === "markdown") {
      blocks.push(...splitTerminals(token.content))
      continue
    }

    const { type, value, label } = token.directive

    if (type === "SIMULATOR") {
      blocks.push({ kind: "simulator-card", id: value })
      continue
    }

    if (type === "FS-TREE") {
      blocks.push({ kind: "fs-tree" })
      continue
    }

    if (type === "EJERCICIO") {
      blocks.push({ kind: "exercise", slug: value })
      continue
    }

    if (type === "ACTIVIDAD") {
      blocks.push({ kind: "activity", slug: value })
      continue
    }

    if (type === "ILLUSTRATION") {
      blocks.push({ kind: "illustration", id: value })
      continue
    }

    if (type === "VIDEO") {
      // The directive may omit the extension: "mi-video" → "mi-video.mp4".
      const file = /\.(mp4|webm|mov)$/i.test(value) ? value : `${value}.mp4`
      blocks.push({
        kind: "video",
        title: label,
        src: lessonVideoUrl(topicNumber, file),
        exists: lessonVideoExists(topicNumber, file),
        expectedPath: `public${lessonAssetUrl(topicNumber, file)}`,
      })
      continue
    }

    if (type === "IMAGE-DARK" || type === "IMAGE-LIGHT") {
      const partner = findPartner(tokens, i, type)
      if (partner) {
        const darkFile = type === "IMAGE-DARK" ? value : partner.directive.value
        const lightFile = type === "IMAGE-LIGHT" ? value : partner.directive.value
        blocks.push({
          kind: "image-theme",
          lightSrc: lessonAssetUrl(topicNumber, lightFile),
          darkSrc: lessonAssetUrl(topicNumber, darkFile),
          alt: label || partner.directive.label,
          exists:
            lessonAssetExists(topicNumber, lightFile) &&
            lessonAssetExists(topicNumber, darkFile),
          expectedPaths: [
            `public${lessonAssetUrl(topicNumber, lightFile)}`,
            `public${lessonAssetUrl(topicNumber, darkFile)}`,
          ],
        })
        i = partner.index // consume the partner directive too
        continue
      }
      // Unpaired: fall through and render it as a normal image.
    }

    blocks.push({
      kind: "image",
      src: lessonAssetUrl(topicNumber, value),
      alt: label,
      exists: lessonAssetExists(topicNumber, value),
      expectedPath: `public${lessonAssetUrl(topicNumber, value)}`,
    })
  }

  // 3. The bibliography always closes the lesson.
  if (sources) blocks.push({ kind: "sources", content: sources })

  return blocks
}
