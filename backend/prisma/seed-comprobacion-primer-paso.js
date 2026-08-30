const prisma = require("./client")

const SLUG = "primer-paso"
const RUTA = "/home/$usuario/hola.txt"

const CHECKS = [
  { type: "archivo_existe", params: { ruta: RUTA }, points: 50, position: 0 },
  { type: "archivo_contiene", params: { ruta: RUTA, patron: "hola" }, points: 50, position: 1 },
]

/* La unica comprobacion que no vive en una leccion: va en la guia, para que el
   estudiante vea funcionar una antes de encontrarse la primera de verdad.
   Cuelga del tema 1 porque `topic_id` es obligatorio, pero sin subtema, asi que
   no suma al progreso de ningun tema (el progreso solo mira las lecciones del
   temario, ver getTopicLessons en shared/lib/content/lessons.ts). */
const TOPIC_NUMBER = 1

const DATOS = {
  title: "Tu primer comando",
  kind: "check",
  difficulty: "basic",
  instructions:
    "Abre la terminal y crea, en tu carpeta personal, un archivo llamado " +
    "hola.txt que contenga la palabra hola.",
}

async function main() {
  const topic = await prisma.topic.findUnique({ where: { order_number: TOPIC_NUMBER } })
  if (!topic) throw new Error(`Topic ${TOPIC_NUMBER} no encontrado. Corre seed-temario primero.`)

  const activity = await prisma.topicActivity.upsert({
    where: { slug: SLUG },
    update: { ...DATOS, topic_id: topic.id, subtopic_id: null, checks: CHECKS },
    create: { slug: SLUG, ...DATOS, topic_id: topic.id, subtopic_id: null, checks: CHECKS },
  })

  console.log(`Comprobacion sembrada: ${activity.slug} (guia del laboratorio)`)
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
