const prisma = require("./client")

const SLUG = "paquete-de-entrega"
const RAIZ = "/home/$usuario/actividades/paquete-de-entrega"

const INFORME = [
  "Practica de compresion",
  "Autor: estudiante de LinuxLab",
  "Resultado: el archivo pesa menos que la suma de sus partes",
].join("\n") + "\n"

const SETUP = {
  dirs: ["informe"],
  files: [
    { path: "informe/informe.txt", content: INFORME },
    { path: "informe/datos.csv", content: "archivo,tamano\nregistro-1.log,4096\nregistro-2.log,8192\n" },
    { path: "informe/notas.txt", content: "Revisar las cifras antes de entregar.\n" },
    { path: "borrador.tmp", content: "borrador viejo, no va en la entrega\n" },
  ],
}

const CHECKS = [
  { type: "archivo_existe", params: { ruta: `${RAIZ}/entrega.tar.gz` }, points: 20, position: 0 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/contenido.txt`, patron: "informe/datos.csv" }, points: 20, position: 1 },
  { type: "directorio_existe", params: { ruta: `${RAIZ}/revision/informe` }, points: 20, position: 2 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/revision/informe/informe.txt`, valor: INFORME }, points: 20, position: 3 },
  { type: "archivo_no_existe", params: { ruta: `${RAIZ}/borrador.tmp` }, points: 20, position: 4 },
]

const TOPIC_NUMBER = 6
const SUBTOPIC_SLUG = "tar"

const DATOS = {
  title: "El paquete de entrega",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Empaqueta la carpeta del informe en un .tar.gz, deja por escrito qué " +
    "trae dentro, comprueba que el paquete abre extrayéndolo en otra carpeta " +
    "y quita lo que no se entrega.",
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
