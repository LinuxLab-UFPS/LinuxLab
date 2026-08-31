const prisma = require("./client")

const SLUG = "comprimir-el-informe"
const ORIGINAL = "/home/$usuario/notas.txt"
const COMPRIMIDO = "/home/$usuario/notas.txt.gz"

/* Un .gz no se puede leer con archivo_contiene (el checker lee texto plano), y
   no hace falta: gzip SUSTITUYE el original, asi que comprobar que el paquete
   esta y el original ya no es exactamente lo que enseña la leccion. */
const CHECKS = [
  { type: "archivo_existe", params: { ruta: COMPRIMIDO }, points: 50, position: 0 },
  { type: "archivo_no_existe", params: { ruta: ORIGINAL }, points: 50, position: 1 },
]

const TOPIC_NUMBER = 6
const SUBTOPIC_SLUG = "comprimir"

const DATOS = {
  title: "Guarda las notas comprimidas",
  kind: "check",
  difficulty: "basic",
  instructions:
    "Abre la terminal y crea notas.txt en tu carpeta personal con al menos una " +
    "línea escrita. Comprímelo con gzip y deja solo el archivo comprimido: el " +
    "original no debe quedar.",
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
