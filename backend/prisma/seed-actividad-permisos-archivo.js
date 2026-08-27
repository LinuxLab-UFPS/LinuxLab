const prisma = require("./client")

const SLUG = "cada-archivo-en-su-sitio"
const RAIZ = "/home/$usuario/actividades/cada-archivo-en-su-sitio"

const SETUP = {
  files: [
    { path: "notas.txt", content: "Apuntes sueltos del laboratorio\n" },
    { path: "informe.txt", content: "Informe de la practica\n" },
    { path: "arranque.sh", content: "#!/bin/bash\necho \"laboratorio listo\"\n" },
    { path: "plantilla.txt", content: "Plantilla oficial, no modificar\n" },
    { path: "TUBO.exe", content: "binario de la casa, no preguntes\n" },
  ],
}

const CHECKS = [
  { type: "permisos_son", params: { ruta: `${RAIZ}/notas.txt`, modo: "600" }, points: 20, position: 0 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/informe.txt`, modo: "644" }, points: 20, position: 1 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/arranque.sh`, modo: "755" }, points: 20, position: 2 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/plantilla.txt`, modo: "444" }, points: 20, position: 3 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/TUBO.exe`, modo: "700" }, points: 20, position: 4 },
]

const TOPIC_NUMBER = 5
const SUBTOPIC_SLUG = "chmod"

const DATOS = {
  title: "Cada archivo en su sitio",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "El empleado anterior dejó unos archivos con los permisos incorrectos. " +
    "Deja cada uno con los que pide su función.",
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
