const prisma = require("./client")

const SLUG = "permisos-del-informe"
const RUTA = "/home/$usuario/informe.txt"

const CHECKS = [
  { type: "archivo_existe", params: { ruta: RUTA }, points: 34, position: 0 },
  { type: "minimo_lineas", params: { ruta: RUTA, cantidad: "1" }, points: 33, position: 1 },
  { type: "permisos_son", params: { ruta: RUTA, modo: "640" }, points: 33, position: 2 },
]

const TOPIC_NUMBER = 5
const SUBTOPIC_SLUG = "chmod"

const DATOS = {
  title: "El informe del grupo",
  kind: "check",
  difficulty: "basic",
  instructions:
    "Abre la terminal y crea informe.txt en tu carpeta personal con al menos " +
    "una línea escrita. Déjalo de forma que puedas leerlo y escribirlo tú, que " +
    "tu grupo solo pueda leerlo, y que los demás no puedan hacer nada con él.",
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
