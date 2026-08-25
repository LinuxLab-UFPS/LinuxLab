const prisma = require("./client")

const SLUG = "el-turno-de-noche"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

const CHECKS = [
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/trabajos.txt`, patron: "sleep" }, points: 30, position: 0 },
  { type: "minimo_lineas", params: { ruta: `${RAIZ}/trabajos.txt`, cantidad: 3 }, points: 30, position: 1 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/restantes.txt`, valor: "2" }, points: 40, position: 2 },
]

const TOPIC_NUMBER = 9
const SUBTOPIC_SLUG = "primer-y-segundo-plano"

const DATOS = {
  title: "El turno de noche",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Deja tres tareas corriendo en segundo plano, apunta cuáles son, cierra " +
    "una y cuenta las que quedan.",
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
