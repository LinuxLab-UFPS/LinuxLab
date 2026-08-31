const prisma = require("./client")

const SLUG = "logo-ufps"
const RUTA = "/home/$usuario/logo.txt"

const FILAS = [
  "🟥⬜🟥⬜🟥⬜⬜⬜🟥⬜⬜⬜🟥⬜⬜⬜🟥",
  "🟥⬜🟥⬜🟥⬜⬜🟥🟥⬜⬜⬜🟥⬜⬜⬜🟥",
  "🟥⬜⬜⬜🟥⬜🟥🟥🟥⬜🟥🟥🟥⬜⬜⬜🟥",
]

const CHECKS = [
  { type: "archivo_existe", params: { ruta: RUTA }, points: 25, position: 0 },
  ...FILAS.map((patron, i) => ({
    type: "archivo_contiene",
    params: { ruta: RUTA, patron },
    points: 25,
    position: i + 1,
  })),
]

const TOPIC_NUMBER = 4
const SUBTOPIC_SLUG = "pipes"

const DATOS = {
  title: "Guarda el logo",
  kind: "check",
  difficulty: "basic",
  instructions:
    "Abre la terminal, presiona el botón 'Copiar el logo' y guarda su salida en " +
    "un archivo llamado logo.txt, dentro de tu directorio personal. Puedes usar " +
    "cat > logo.txt para escribir algo directamente en el archivo; cuando " +
    "termines, presiona Ctrl+D.",
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
