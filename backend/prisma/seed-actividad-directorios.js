const prisma = require("./client")

const SLUG = "crear-directorio-practicas"

const CHECKS = [
  { type: "directorio_existe", params: { ruta: "/home/$usuario/practicas" }, points: 50, position: 0 },
  { type: "directorio_existe", params: { ruta: "/home/$usuario/practicas/tema-03" }, points: 50, position: 1 },
]

const TOPIC_NUMBER = 3
const SUBTOPIC_SLUG = "practica-directorios"

const DATOS = {
  title: "Crea tu primer directorio",
  kind: "check",
  difficulty: "basic",
  instructions:
    "Crea un directorio llamado practicas dentro de tu carpeta personal y, dentro de él, otro llamado tema-03.",
}

async function main() {
  const topic = await prisma.topic.findUnique({ where: { order_number: TOPIC_NUMBER } })
  if (!topic) throw new Error(`Topic ${TOPIC_NUMBER} no encontrado. Corre seed-temario primero.`)

  const subtopic = await prisma.subtopic.findUnique({
    where: { topic_id_slug: { topic_id: topic.id, slug: SUBTOPIC_SLUG } },
  })

  const activity = await prisma.topicActivity.upsert({
    where: { slug: SLUG },
    update: { ...DATOS, topic_id: topic.id, subtopic_id: subtopic?.id ?? null, checks: CHECKS },
    create: { slug: SLUG, ...DATOS, topic_id: topic.id, subtopic_id: subtopic?.id ?? null, checks: CHECKS },
  })

  console.log(`Comprobacion sembrada: ${activity.slug} (topic ${TOPIC_NUMBER}, subtopic ${SUBTOPIC_SLUG})`)
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
