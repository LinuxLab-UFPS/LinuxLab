const prisma = require("./client")

const SLUG = "universidad-facultades"
const FACULTADES = ["ingenieria", "enfermeria", "arquitectura"]
const RAIZ = "/home/$usuario/universidad"

function buildChecks() {
  const list = [{ type: "directorio_existe", params: { ruta: RAIZ } }]
  for (const f of FACULTADES) list.push({ type: "directorio_existe", params: { ruta: `${RAIZ}/${f}` } })
  for (const f of FACULTADES) list.push({ type: "archivo_existe", params: { ruta: `${RAIZ}/${f}/pensum.txt` } })

  const each = Math.floor(100 / list.length)
  return list.map((check, i) => ({
    ...check,
    position: i,
    points: i === 0 ? 100 - each * (list.length - 1) : each,
  }))
}

const CHECKS = buildChecks()

const TOPIC_NUMBER = 4
const SUBTOPIC_SLUG = "touch"

const DATOS = {
  title: "Archivos y ficheros",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Crea el directorio universidad en tu carpeta personal, con las facultades " +
      "ingenieria, enfermeria y arquitectura dentro, y un pensum.txt en cada una.",
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

  console.log(`Actividad sembrada: ${activity.slug} (topic ${TOPIC_NUMBER}, subtopic ${SUBTOPIC_SLUG})`)
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
