#!/usr/bin/env node
/**
 * Genera `shared/lib/content/temario.ts` (el syllabus) desde los meta.json de
 * `content/temario/tema-NN/`, que son la fuente unica de la estructura del
 * temario. Los client components siguen importando `syllabus`/`getTopic` sin
 * cambios: solo cambia quien escribe el archivo.
 *
 * Uso:
 *   node scripts/gen-syllabus.mjs          # regenera el archivo
 *   node scripts/gen-syllabus.mjs --check  # falla si el archivo difiere (CI)
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const CONTENT_DIR = join(ROOT, "content", "temario")
const OUT_FILE = join(ROOT, "shared", "lib", "content", "temario.ts")

function topicDirs() {
  return readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^tema-\d+$/.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]))
}

function loadTopic(metaPath) {
  const raw = JSON.parse(readFileSync(metaPath, "utf8"))
  return {
    number: raw.number,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    subtopics: (raw.subtopics ?? []).map((s, i) => ({
      number: s.number ?? i + 1,
      title: s.title,
    })),
  }
}

function render(topics) {
  const lines = [
    "/**",
    " * GENERADO por scripts/gen-syllabus.mjs — NO editar a mano.",
    " *",
    " * El catalogo del temario del curso (RF-01): los docentes habilitan temas",
    " * por curso pero nunca editan esta lista. La fuente unica de estructura es",
    " * `content/temario/tema-NN/meta.json`; el contenido de lecciones vive en los",
    " * .md de esa misma carpeta.",
    " */",
    'import type { Topic } from "@/lib/features/student/types"',
    "",
    `export const syllabus: Topic[] = [`,
  ]

  for (const t of topics) {
    lines.push("  {")
    lines.push(`    number: ${t.number},`)
    lines.push(`    slug: "${t.slug}",`)
    lines.push(`    title: ${JSON.stringify(t.title)},`)
    lines.push(`    description: ${JSON.stringify(t.description)},`)
    if (t.subtopics.length === 0) {
      lines.push("    subTopics: [],")
    } else {
      lines.push("    subTopics: [")
      for (const s of t.subtopics) {
        lines.push(`      { number: ${s.number}, title: ${JSON.stringify(s.title)} },`)
      }
      lines.push("    ],")
    }
    lines.push("  },")
  }

  lines.push("]", "")
  lines.push("/** Lookup a topic by its number. */")
  lines.push("export function getTopic(number: number): Topic | undefined {")
  lines.push("  return syllabus.find((t) => t.number === number)")
  lines.push("}", "")
  lines.push("/** Lookup a topic by its slug. */")
  lines.push("export function getTopicBySlug(slug: string): Topic | undefined {")
  lines.push("  return syllabus.find((t) => t.slug === slug)")
  lines.push("}")
  lines.push("")

  return lines.join("\n")
}

const topics = topicDirs().map((dir) => loadTopic(join(CONTENT_DIR, dir, "meta.json")))
topics.sort((a, b) => a.number - b.number)

const output = render(topics)
const check = process.argv.includes("--check")

if (check) {
  const current = readFileSync(OUT_FILE, "utf8")
  if (current !== output) {
    console.error(`[gen-syllabus] ${OUT_FILE} no esta al dia. Corre: node scripts/gen-syllabus.mjs`)
    process.exit(1)
  }
  console.log(`[gen-syllabus] OK: ${topics.length} temas al dia`)
  process.exit(0)
}

writeFileSync(OUT_FILE, output)
console.log(`[gen-syllabus] ${OUT_FILE} regenerado (${topics.length} temas)`)