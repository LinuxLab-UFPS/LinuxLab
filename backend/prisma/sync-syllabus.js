#!/usr/bin/env node
/**
 * Sincroniza el temario de la BD con la fuente canonica de estructura:
 * los `meta.json` de `frontend/content/temario/tema-NN/`.
 *
 * Reglas:
 *  - Upsert por slug (topic) y por (topic_id, slug) (subtopic): inserta los
 *    que faltan y actualiza titulo/descripcion/numero/orden de los existentes.
 *  - NO borra filas: las actividades y el progreso apuntan a estos ids; solo
 *    se avisa de lo que existe en BD pero ya no esta en el contenido.
 *  - Idempotente: sin cambios en el contenido no toca filas.
 *
 * Uso (host o contenedor):
 *   SYLLABUS_CONTENT_DIR=frontend/content/temario DATABASE_URL=... node sync-syllabus.js
 */
const path = require("path")
const fs = require("fs")
const prisma = require("./client")

const CONTENT_DIR = process.env.SYLLABUS_CONTENT_DIR || path.resolve(__dirname, "../../frontend/content/temario")

function topicDirs() {
  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory() && /^tema-\d+$/.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]))
}

function loadTopic(metaPath) {
  const raw = JSON.parse(fs.readFileSync(metaPath, "utf8"))
  return {
    number: raw.number,
    slug: raw.slug,
    title: raw.title,
    description: raw.description ?? null,
    subtopics: (raw.subtopics ?? []).map((s, i) => ({
      number: s.number ?? i + 1,
      slug: s.id,
      title: s.title,
      order: s.order ?? i + 1,
    })),
  }
}

async function main() {
  const dirs = topicDirs()
  if (dirs.length === 0) {
    console.error(`[sync] No hay temas en ${CONTENT_DIR}`)
    process.exit(1)
  }

  const loaded = dirs.map((dir) => loadTopic(path.join(CONTENT_DIR, dir, "meta.json")))
  const bySlug = new Map(loaded.map((t) => [t.slug, t]))
  const expectedSubtopics = new Set()
  const stats = { topics: 0, subtopics: 0, updated: 0, created: 0 }

  for (const topic of loaded) {
    const existing = await prisma.topic.findUnique({ where: { slug: topic.slug } })
    const data = {
      number: topic.number,
      title: topic.title,
      description: topic.description,
    }
    if (existing) {
      await prisma.topic.update({ where: { id: existing.id }, data })
      stats.topics += 1
      stats.updated += 1
    } else {
      await prisma.topic.create({
        data: {
          slug: topic.slug,
          order: topic.number,
          ...data,
        },
      })
      stats.topics += 1
      stats.created += 1
    }

    const topicId = (await prisma.topic.findUnique({ where: { slug: topic.slug }, select: { id: true } })).id
    for (const sub of topic.subtopics) {
      expectedSubtopics.add(sub.slug)
      const key = { topic_id: topicId, slug: sub.slug }
      const existingSub = await prisma.subtopic.findFirst({ where: key })
      const subData = {
        number: sub.number,
        title: sub.title,
        order: sub.order,
      }
      if (existingSub) {
        await prisma.subtopic.update({ where: { id: existingSub.id }, data: subData })
        stats.subtopics += 1
        stats.updated += 1
      } else {
        await prisma.subtopic.create({ data: { ...key, ...subData } })
        stats.subtopics += 1
        stats.created += 1
      }
    }
  }

  // Aviso de huerfanos: filas que existen en BD pero no en el contenido.
  const dbTopics = await prisma.topic.findMany({ select: { slug: true } })
  for (const t of dbTopics) {
    if (!bySlug.has(t.slug)) {
      console.warn(`[sync] WARN: topic "${t.slug}" en BD no existe en ${CONTENT_DIR} (no se borra)`)
    }
  }

  console.log(
    `[sync] OK: ${stats.topics} topics, ${stats.subtopics} subtopics (${stats.created} creados, ${stats.updated} actualizados)`,
  )
}

main()
  .catch((err) => {
    console.error("[sync] ERROR:", err.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })