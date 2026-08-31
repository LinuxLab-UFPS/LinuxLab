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
 *   <!-- EJERCICIO: slug | snippet -->            (la misma, con boton de copiar dentro)
 *   <!-- EJEMPLO-COMPROBACION -->                 (una de mentira, solo la forma)
 *   <!-- ACTIVIDAD: slug -->                      (tarjeta que lleva a la terminal)
 *   <!-- COPIAR: id -->                           (boton que copia sin mostrar)
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
  | { kind: "terminal-demo" }
  | { kind: "illustration"; id: string }
  | { kind: "exercise"; slug: string; snippet?: string }
  | { kind: "example-check" }
  | { kind: "activity"; slugs: string[] }
  | { kind: "snippet"; id: string }

interface Directive {
  type: string
  value: string
  label: string
}

type Token =
  | { kind: "markdown"; content: string }
  | { kind: "directive"; directive: Directive }

const DIRECTIVE_RE =
  /<!--\s*(IMAGE-DARK|IMAGE-LIGHT|IMAGE|VIDEO|SIMULATOR|FS-TREE|ILLUSTRATION|EJEMPLO-COMPROBACION|EJERCICIO|ACTIVIDAD|COPIAR|TERMINAL-DEMO)\s*(?::\s*([^|\s][^|]*?)\s*(?:\|\s*(.*?)\s*)?)?-->/g

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

/**
 * El titulo repetido.
 *
 * Cada leccion abre con un `##` que dice como se llama: era la unica forma de
 * saberlo, porque la pagina no lo ponia en ningun sitio. Ahora la cabecera lo
 * escribe arriba, asi que en la mitad de los archivos —los que titulan igual que
 * su entrada del temario— el nombre salia dos veces seguidas.
 *
 * Se quita solo cuando coincide. Cuando dice otra cosa («Encadenar comandos» en
 * el temario, «head y tail» en el archivo) no es una repeticion sino el primer
 * apartado de la leccion, y se queda donde esta.
 *
 * El heading no siempre es la primera linea: puede ir detras de una directiva
 * —`<!-- VIDEO: ... -->` abre varias lecciones— y esa se conserva.
 */
const LEADING_HEADING_RE = /^((?:\s*<!--[\s\S]*?-->)*\s*)#{1,3}[ \t]+([^\n]+?)[ \t]*(?:\r?\n|$)/

function normalizeTitle(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ")
}

function dropRepeatedTitle(markdown: string, lessonTitle?: string): string {
  if (!lessonTitle) return markdown
  const match = markdown.match(LEADING_HEADING_RE)
  if (!match || normalizeTitle(match[2]) !== normalizeTitle(lessonTitle)) return markdown
  return match[1] + markdown.slice(match[0].length)
}

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

/**
 * Recoge la tanda de ACTIVIDAD seguidas que empieza en `from`, saltando el
 * texto en blanco de en medio.
 *
 * Una lección puede ofrecer más de una actividad, y antes cada directivo era su
 * propio bloque: salía el encabezado repetido, una tarjeta debajo de otra. Al
 * juntarlas en un bloque, el encabezado se escribe una vez y las tarjetas caben
 * en la misma fila.
 */
function runOfActivities(
  tokens: Token[],
  from: number,
  first: string,
): { slugs: string[]; last: number } {
  const slugs: string[] = [first]
  let last = from

  for (let j = from + 1; j < tokens.length; j++) {
    const token = tokens[j]
    if (token.kind === "markdown") {
      if (token.content.trim()) break
      continue
    }
    if (token.directive.type !== "ACTIVIDAD") break
    slugs.push(token.directive.value)
    last = j
  }
  return { slugs, last }
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

export function parseLessonBlocks(
  markdown: string,
  topicNumber: number,
  lessonTitle?: string,
): LessonBlock[] {
  // 0. Drop the title when the header above already says it, then peel the
  //    bibliography off the end; it is rendered as a disclosure.
  const source = dropRepeatedTitle(markdown, lessonTitle)
  let body = source
  let sources: string | null = null
  const sourcesMatch = source.match(SOURCES_RE)
  if (sourcesMatch && sourcesMatch.index !== undefined) {
    sources = sourcesMatch[1].trim()
    body = source.slice(0, sourcesMatch.index).trimEnd()
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

    // El boton de la terminal incrustado en el texto (solo la guia).
    if (type === "TERMINAL-DEMO") {
      blocks.push({ kind: "terminal-demo" })
      continue
    }

    // Una comprobacion de mentira, solo para enseñar la forma (ver la guia).
    if (type === "EJEMPLO-COMPROBACION") {
      blocks.push({ kind: "example-check" })
      continue
    }

    // El `label` es el snippet que la comprobacion reparte, si lo lleva:
    // `<!-- EJERCICIO: slug | snippet -->`. Va dentro de la tarjeta, no suelto
    // en la leccion, porque el boton es parte del enunciado.
    if (type === "EJERCICIO") {
      blocks.push({ kind: "exercise", slug: value, snippet: label || undefined })
      continue
    }

    if (type === "ACTIVIDAD") {
      const tanda = runOfActivities(tokens, i, value)
      blocks.push({ kind: "activity", slugs: tanda.slugs })
      i = tanda.last // consume las que se juntaron con esta
      continue
    }

    if (type === "COPIAR") {
      blocks.push({ kind: "snippet", id: value })
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
