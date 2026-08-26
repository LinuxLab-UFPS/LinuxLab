const prisma = require("./client")

const SLUG = "la-carpeta-del-equipo"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

const CHECKS = [
  { type: "directorio_existe", params: { ruta: `${RAIZ}/equipo` }, points: 20, position: 0 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/equipo`, modo: "2770" }, points: 30, position: 1 },
  { type: "archivo_existe", params: { ruta: `${RAIZ}/equipo/acta.txt` }, points: 20, position: 2 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/prueba.txt`, patron: "grp_" }, points: 30, position: 3 },
]

const TOPIC_NUMBER = 8
const SUBTOPIC_SLUG = "trabajo-en-grupo"

const DATOS = {
  title: "La carpeta del equipo",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Monta una carpeta compartida de verdad: del grupo del curso, cerrada a " +
    "los de fuera y con setgid, para que todo lo que nazca dentro herede el " +
    "grupo. Y deja la prueba de que funcionó.",
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
