const prisma = require("./client")

const SLUG = "el-arbol-del-proyecto"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

const SETUP = {
  dirs: ["proyecto/api", "proyecto/web", "proyecto/datos", "metricas"],
  files: [
    { path: "proyecto/api/config.conf", content: "puerto = 8080\ntiempo_espera = 2\n" },
    { path: "proyecto/api/app.log", lines: 30, fill: "INFO peticion atendida" },
    { path: "proyecto/web/config.conf", content: "raiz = /var/www\n" },
    { path: "proyecto/web/nginx.conf", content: "worker_processes = 4\n" },
    { path: "proyecto/web/acceso.log", lines: 45, fill: "GET /inicio 200" },
    { path: "proyecto/datos/respaldo.csv", content: "tabla,filas\nusuarios,1420\npedidos,8830\n" },
    { path: "proyecto/leeme.txt", content: "Copia de trabajo del proyecto.\n" },
    {
      path: "metricas/errores.csv",
      content:
        "servicio,errores\npagos,12\nsesiones,3\ncatalogo,25\ninformes,7\nnotificaciones,18\n",
    },
  ],
}

const CHECKS = [
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/configs.txt`, patron: "proyecto/web/nginx.conf" }, points: 20, position: 0 },
  { type: "minimo_lineas", params: { ruta: `${RAIZ}/configs.txt`, cantidad: 3 }, points: 20, position: 1 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/total.txt`, valor: "75" }, points: 30, position: 2 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/peor.txt`, valor: "catalogo" }, points: 30, position: 3 },
]

const TOPIC_NUMBER = 7
const SUBTOPIC_SLUG = "find"

const DATOS = {
  title: "El árbol del proyecto",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Tres preguntas sobre el mismo árbol: qué configuraciones hay, cuánto " +
    "ocupan las bitácoras y qué servicio falla más. Una herramienta para cada una.",
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
