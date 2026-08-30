const prisma = require("./client")

const SLUG = "saludo-ejecutable"
const RUTA = "/home/$usuario/saludo.sh"

const CHECKS = [
  { type: "archivo_existe", params: { ruta: RUTA }, points: 34, position: 0 },
  { type: "archivo_contiene", params: { ruta: RUTA, patron: "#!/bin/bash" }, points: 33, position: 1 },
  { type: "permisos_son", params: { ruta: RUTA, modo: "755" }, points: 33, position: 2 },
]

const TOPIC_NUMBER = 10
const SUBTOPIC_SLUG = "primer-script"

const DATOS = {
  title: "Un script que saluda",
  kind: "check",
  difficulty: "basic",
  instructions:
    "Abre la terminal y escribe un script llamado saludo.sh en tu carpeta " +
    "personal. La primera línea tiene que ser el shebang de bash y la segunda " +
    "un echo con el saludo que quieras. Déjalo con permisos 755 para poder " +
    "ejecutarlo con ./saludo.sh.",
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
