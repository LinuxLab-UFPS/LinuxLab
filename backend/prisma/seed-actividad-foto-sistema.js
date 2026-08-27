const prisma = require("./client")

const SLUG = "foto-del-sistema"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

const CHECKS = [
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/procesos.txt`, patron: "bash" }, points: 25, position: 0 },
  { type: "minimo_lineas", params: { ruta: `${RAIZ}/procesos.txt`, cantidad: 2 }, points: 25, position: 1 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/senal-9.txt`, valor: "KILL" }, points: 25, position: 2 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/senal-15.txt`, valor: "TERM" }, points: 25, position: 3 },
]

const TOPIC_NUMBER = 9
const SUBTOPIC_SLUG = "ver-procesos"

const DATOS = {
  title: "La foto del sistema",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Deja constancia de lo que está corriendo en tu cuenta y averigua cómo se " +
    "llaman las dos señales que más se usan para cerrar un proceso.",
  /* Sin archivos que preparar, pero con `setup` de todas formas: el script crea
     la carpeta de la actividad aunque no haya nada dentro. Asi el estudiante la
     encuentra hecha (el enunciado no tiene que pedirle un `mkdir`) y el boton de
     rehacer archivos funciona igual que en las demas. */
  setup: {},
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
