const prisma = require("./client")

const SLUG = "el-guion-que-decide"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

const SETUP = {
  dirs: ["datos"],
  files: [
    { path: "datos/alfa.log", lines: 12, fill: "INFO tarea completada" },
    { path: "datos/beta.log", lines: 30, fill: "INFO lote procesado" },
    { path: "datos/gamma.log", lines: 8, fill: "INFO sincronizacion" },
    { path: "datos/leeme.txt", content: "Solo cuentan los .log de esta carpeta.\n" },
  ],
}

const CHECKS = [
  { type: "archivo_existe", params: { ruta: `${RAIZ}/reporte.sh` }, points: 15, position: 0 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/reporte.sh`, modo: "755" }, points: 15, position: 1 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/reporte.sh`, patron: "for" }, points: 10, position: 2 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/reporte.sh`, patron: "if" }, points: 10, position: 3 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/reporte.txt`, patron: "alfa.log: 12" }, points: 20, position: 4 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/reporte.txt`, patron: "TOTAL: 50" }, points: 15, position: 5 },
  { type: "ultima_linea_es", params: { ruta: `${RAIZ}/reporte.txt`, valor: "REVISAR" }, points: 15, position: 6 },
]

const TOPIC_NUMBER = 10
const SUBTOPIC_SLUG = null

const DATOS = {
  title: "El guion que decide",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Un script que recorra las bitácoras, cuente sus líneas y decida al final " +
    "si el total pasa del umbral.",
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
