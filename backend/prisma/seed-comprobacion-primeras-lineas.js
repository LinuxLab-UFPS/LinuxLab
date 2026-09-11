const prisma = require("./client")

const SLUG = "primeras-lineas"
const RUTA = "/home/$usuario/primeras.txt"

/* Sustituye a la comprobacion del logo, que repartia ocho lineas de emoji y no
   revisaba nada de lo que enseña el subtema: el boton hacia la redireccion por
   el estudiante. Esta pide justo lo que acaba de leer —`head` y `>`— y se puede
   comprobar sin trucos: la primera linea de /etc/passwd es `root` en cualquier
   Linux, asi que el resultado no depende de la imagen del contenedor. */
const CHECKS = [
  { type: "archivo_existe", params: { ruta: RUTA }, points: 34, position: 0 },
  { type: "minimo_lineas", params: { ruta: RUTA, cantidad: "5" }, points: 33, position: 1 },
  { type: "archivo_contiene", params: { ruta: RUTA, patron: "root" }, points: 33, position: 2 },
]

const TOPIC_NUMBER = 4
const SUBTOPIC_SLUG = "pipes"

const DATOS = {
  title: "Guarda las primeras líneas",
  kind: "check",
  difficulty: "basic",
  instructions:
    "En tu directorio personal, guarda en primeras.txt las cinco primeras líneas " +
    "de /etc/passwd. Usa head para quedarte con esas cinco y > para mandarlas al " +
    "archivo en vez de a la pantalla." +
    " Cuando termines, pulsa el botón de comprobar.",
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

  console.log(`Comprobacion ${activity.slug}: ${activity.title}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
