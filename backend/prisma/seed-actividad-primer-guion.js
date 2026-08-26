const prisma = require("./client")

const SLUG = "tu-primer-guion"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

const CHECKS = [
  { type: "archivo_existe", params: { ruta: `${RAIZ}/saludo.sh` }, points: 20, position: 0 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/saludo.sh`, modo: "755" }, points: 25, position: 1 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/saludo.sh`, patron: "#!/bin/bash" }, points: 25, position: 2 },
  { type: "ultima_linea_es", params: { ruta: `${RAIZ}/salida.txt`, valor: "$codigo" }, points: 30, position: 3 },
]

const TOPIC_NUMBER = 10
const SUBTOPIC_SLUG = null

const DATOS = {
  title: "Tu primer guion",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Escribe un script con su cabecera, dale permiso de ejecución y haz que " +
    "al correrlo deje tu código estudiantil escrito en un archivo.",
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
