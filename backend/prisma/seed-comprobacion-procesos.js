const prisma = require("./client")

const SLUG = "lista-de-procesos"
const RUTA = "/home/$usuario/procesos.txt"

/* El checker solo mira el sistema de archivos, nunca procesos vivos, asi que lo
   que se comprueba es la salida guardada. "USER" es la cabecera de `ps aux`:
   prueba que hubo una redireccion de verdad y no un archivo escrito a mano. */
const CHECKS = [
  { type: "archivo_existe", params: { ruta: RUTA }, points: 34, position: 0 },
  { type: "archivo_contiene", params: { ruta: RUTA, patron: "USER" }, points: 33, position: 1 },
  { type: "minimo_lineas", params: { ruta: RUTA, cantidad: "5" }, points: 33, position: 2 },
]

const TOPIC_NUMBER = 9
const SUBTOPIC_SLUG = "ver-procesos"

const DATOS = {
  title: "La foto de los procesos",
  kind: "check",
  difficulty: "basic",
  instructions:
    "Abre la terminal y guarda en un archivo llamado procesos.txt, en tu " +
    "carpeta personal, la lista de los procesos de todas las cuentas con su " +
    "consumo de CPU y memoria. Usa una redirección: el archivo tiene que " +
    "quedar con la salida del comando, cabecera incluida.",
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

  console.log(`Comprobacion sembrada: ${activity.slug} (topic ${TOPIC_NUMBER}, subtopic ${SUBTOPIC_SLUG})`)
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
