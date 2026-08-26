const prisma = require("./client")

const SLUG = "mensaje-oculto"
const RAIZ = "/home/$usuario/actividades/mensaje-oculto"

const SETUP = {
  shuffle: {
    files: ["bloque-a.txt", "bloque-b.txt", "bloque-c.txt", "bloque-d.txt"],
    lines: 100,
    fill: "registro",
    blocks: [
      ["███████████████████", "█                 █"],
      ["█ █ █ ███ ███ ███ █", "█ █ █ █   █ █ █   █"],
      ["█ █ █ ██  ███ ███ █", "█ █ █ █   █     █ █"],
      ["█ ███ █   █   ███ █", "█                 █", "███████████████████"],
    ],
  },
}

const LOGO = "███████████████████\n█                 █\n█ █ █ ███ ███ ███ █\n█ █ █ █   █ █ █   █\n█ █ █ ██  ███ ███ █\n█ █ █ █   █     █ █\n█ ███ █   █   ███ █\n█                 █\n███████████████████"

const CHECKS = [
  { type: "archivo_existe", params: { ruta: `${RAIZ}/logo.txt` }, points: 30, position: 0 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/logo.txt`, valor: LOGO + "\n$codigo" }, points: 70, position: 1 },
]

const TOPIC_NUMBER = 4
const SUBTOPIC_SLUG = "copiar-borrar"

const DATOS = {
  title: "Arma el logo",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "El logo está repartido en trozos entre cuatro archivos. Reúnelos en " +
    "logo.txt en el orden correcto y firma con tu código en la última línea.",
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
