const prisma = require("./client")

const SLUG = "ficha-personal"
const RUTA = "/home/$usuario/$codigo.txt"
const LINEAS_MINIMAS = 5

const CHECKS = [
  { type: "archivo_existe", params: { ruta: RUTA }, points: 34, position: 0 },
  { type: "minimo_lineas", params: { ruta: RUTA, cantidad: String(LINEAS_MINIMAS) }, points: 33, position: 1 },
  { type: "ultima_linea_es", params: { ruta: RUTA, valor: "$correo" }, points: 33, position: 2 },
]

const TOPIC_NUMBER = 4
const SUBTOPIC_SLUG = "editores"

const DATOS = {
  title: "Tu ficha en el laboratorio",
  kind: "check",
  difficulty: "basic",
  instructions:
    "Crea un archivo con tu código estudiantil como nombre y edítalo con vi: " +
    "tu nombre en la primera línea, tres comandos aprendidos en las siguientes " +
    "y tu correo institucional al final.",
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
