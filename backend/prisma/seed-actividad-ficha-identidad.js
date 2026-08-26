const prisma = require("./client")

const SLUG = "tu-ficha-de-identidad"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

const CHECKS = [
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/identidad.txt`, patron: "uid=" }, points: 25, position: 0 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/identidad.txt`, patron: "grp_" }, points: 25, position: 1 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/cuenta.txt`, patron: "/bin/bash" }, points: 25, position: 2 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/shell.txt`, valor: "/bin/bash" }, points: 25, position: 3 },
]

const TOPIC_NUMBER = 8
const SUBTOPIC_SLUG = "identidad"

const DATOS = {
  title: "Tu ficha de identidad",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Deja por escrito quién eres para el sistema: tu identidad completa, tu " +
    "línea de /etc/passwd y, recortado de ella, el shell con el que entras.",
}

async function main() {
  const topic = await prisma.topic.findUnique({ where: { order_number: TOPIC_NUMBER } })
  if (!topic) throw new Error(`Topic ${TOPIC_NUMBER} no encontrado. Corre seed-temario primero.`)

  const subtopic = SUBTOPIC_SLUG
    ? await prisma.subtopic.findUnique({ where: { topic_id_slug: { topic_id: topic.id, slug: SUBTOPIC_SLUG } } })
    : null

  const activity = await prisma.topicActivity.upsert({
    where: { slug: SLUG },
    update: { ...DATOS, topic_id: topic.id, subtopic_id: subtopic?.id ?? null, checks: CHECKS },
    create: { slug: SLUG, ...DATOS, topic_id: topic.id, subtopic_id: subtopic?.id ?? null, checks: CHECKS },
  })

  console.log(`Actividad sembrada: ${activity.slug} (topic ${TOPIC_NUMBER}, kind=activity)`)
}

main()
  .catch((err) => { console.error(err.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
