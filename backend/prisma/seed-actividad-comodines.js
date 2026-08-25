const prisma = require("./client")

const SLUG = "limpieza-con-comodines"
const RAIZ = "/home/$usuario/actividades/limpieza-con-comodines"

const SETUP = {
  dirs: ["documentos", "imagenes"],
  files: [
    { path: "informe.txt", content: "Informe de laboratorio\n" },
    { path: "notas.txt", content: "Apuntes de clase\n" },
    { path: "resumen.txt", content: "Resumen del tema\n" },
    { path: "captura1.png", content: "(imagen de prueba)\n" },
    { path: "captura2.png", content: "(imagen de prueba)\n" },
    { path: "diagrama.png", content: "(imagen de prueba)\n" },
    { path: "temporal.tmp", content: "basura\n" },
    { path: "cache.tmp", content: "basura\n" },
    { path: "sesion.tmp", content: "basura\n" },
  ],
}

const CHECKS = [
  { type: "archivo_no_existe", params: { ruta: `${RAIZ}/temporal.tmp` }, points: 20, position: 0 },
  { type: "archivo_no_existe", params: { ruta: `${RAIZ}/cache.tmp` }, points: 20, position: 1 },
  { type: "archivo_existe", params: { ruta: `${RAIZ}/documentos/informe.txt` }, points: 20, position: 2 },
  { type: "archivo_existe", params: { ruta: `${RAIZ}/documentos/notas.txt` }, points: 20, position: 3 },
  { type: "archivo_existe", params: { ruta: `${RAIZ}/imagenes/captura1.png` }, points: 20, position: 4 },
]

const TOPIC_NUMBER = 4
const SUBTOPIC_SLUG = "comodines"

const DATOS = {
  title: "Limpieza con comodines",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Borra los .tmp de la carpeta de la actividad, mueve los .txt a " +
    "documentos y los .png a imagenes.",
  setup: SETUP,
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
