const prisma = require("./client")

const SLUG = "rastro-en-los-registros"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

const ERROR = "ERROR fallo critico en el modulo de pagos"

const SETUP = {
  dirs: ["registros"],
  files: [
    {
      path: "registros/lunes.log",
      lines: 40,
      fill: "INFO peticion atendida",
      at: {
        5: "AVISO disco al 80 por ciento",
        12: "AVISO memoria por encima de lo normal",
        27: ERROR,
        33: "AVISO reintento programado",
      },
    },
    {
      path: "registros/martes.log",
      lines: 30,
      fill: "INFO cache renovada",
      at: { 8: "AVISO cola de envios llena", 19: "AVISO conexion lenta" },
    },
    {
      path: "registros/miercoles.log",
      lines: 25,
      fill: "INFO sesion iniciada",
      at: {
        3: "AVISO certificado por vencer",
        14: "AVISO espacio bajo en disco",
      },
    },
  ],
}

const CHECKS = [
  { type: "archivo_es", params: { ruta: `${RAIZ}/hallazgo.txt`, valor: ERROR }, points: 50, position: 0 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/cuenta.txt`, valor: "7" }, points: 50, position: 1 },
]

const TOPIC_NUMBER = 7
const SUBTOPIC_SLUG = "grep"

const DATOS = {
  title: "El rastro en los registros",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Tres bitácoras y una sola línea que importa. Sácala con grep y cuenta " +
    "cuántos avisos hay en total.",
  setup: SETUP,
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
