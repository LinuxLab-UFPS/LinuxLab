const prisma = require("./client")

const SLUG = "tu-ficha-de-identidad"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

/* Hubo un tercer objetivo (`shell.txt` con el septimo campo recortado) que se
   retiro: la unica forma limpia de sacarlo es `cut`, que no se enseña en
   ninguna leccion del temario. */
const CHECKS = [
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/identidad.txt`, patron: "uid=" }, points: 34, position: 0 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/identidad.txt`, patron: "grp_" }, points: 33, position: 1 },
  { type: "archivo_contiene", params: { ruta: `${RAIZ}/cuenta.txt`, patron: "/bin/bash" }, points: 33, position: 2 },
]

const TOPIC_NUMBER = 8
const SUBTOPIC_SLUG = "identidad"

const DATOS = {
  title: "Tu ficha de identidad",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Deja por escrito quién eres para el sistema: tu identidad completa y tu " +
    "línea entera de la base de cuentas.",
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
