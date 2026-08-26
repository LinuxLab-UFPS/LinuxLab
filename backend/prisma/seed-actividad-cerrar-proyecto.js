const prisma = require("./client")

const SLUG = "cerrar-el-proyecto"
const RAIZ = "/home/$usuario/actividades/cerrar-el-proyecto"

const SETUP = {
  dirs: ["config"],
  files: [
    { path: "desplegar.sh", content: "#!/bin/bash\necho \"desplegando\"\n" },
    { path: "leeme.txt", content: "Proyecto de la practica de permisos\n" },
    { path: "respaldo.tmp", content: "copia temporal, sobra en la entrega\n" },
    { path: "config/credenciales.txt", content: "usuario=lab\nclave=cambiala\n" },
  ],
}

const CHECKS = [
  { type: "permisos_son", params: { ruta: `${RAIZ}/desplegar.sh`, modo: "755" }, points: 20, position: 0 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/leeme.txt`, modo: "644" }, points: 20, position: 1 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/config`, modo: "700" }, points: 20, position: 2 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/config/credenciales.txt`, modo: "600" }, points: 20, position: 3 },
  { type: "archivo_no_existe", params: { ruta: `${RAIZ}/respaldo.tmp` }, points: 20, position: 4 },
]

const TOPIC_NUMBER = 5

const DATOS = {
  title: "Cerrar el proyecto",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Deja la carpeta del proyecto lista para entregar: cada archivo y cada " +
    "carpeta con los permisos que le corresponden, y sin sobras.",
  setup: SETUP,
}

async function main() {
  const topic = await prisma.topic.findUnique({ where: { order_number: TOPIC_NUMBER } })
  if (!topic) throw new Error(`Topic ${TOPIC_NUMBER} no encontrado. Corre seed-temario primero.`)

  const activity = await prisma.topicActivity.upsert({
    where: { slug: SLUG },
    update: { ...DATOS, topic_id: topic.id, subtopic_id: null, checks: CHECKS },
    create: { slug: SLUG, ...DATOS, topic_id: topic.id, subtopic_id: null, checks: CHECKS },
  })

  console.log(`Actividad sembrada: ${activity.slug} (topic ${TOPIC_NUMBER}, kind=activity)`)
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
