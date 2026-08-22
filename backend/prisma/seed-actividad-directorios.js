/**
 * La practica del subtema de directorios. Se siembra con `slug` para que la
 * leccion la invoque por nombre y no por id.
 *
 * Es un `upsert`: re-sembrar NO borra la definicion ni su historial (los
 * intentos cuelgan de la definicion con RESTRICT); solo actualiza los campos
 * y re-crea las aserciones cuando el seed cambia.
 */
const prisma = require("./client")

const SLUG = "crear-directorio-practicas"

const CHECKS = [
  {
    type: "directorio_existe",
    params: { ruta: "/home/$usuario/practicas" },
    points: 50,
    position: 0,
  },
  {
    type: "directorio_existe",
    params: { ruta: "/home/$usuario/practicas/tema-03" },
    points: 50,
    position: 1,
  },
]

async function main() {
  const topicId = (await prisma.topic.findFirst({ where: { number: 3 }, select: { id: true } })).id
  const activity = await prisma.activityDefinition.upsert({
    where: { slug: SLUG },
    update: {
      title: "Crea tu primer directorio",
      instructions:
        "Crea un directorio llamado practicas dentro de tu carpeta personal y, dentro de él, otro llamado tema-03.",
      topic_id: topicId,
      max_score: 100,
      checks: { deleteMany: {}, create: CHECKS },
    },
    create: {
      slug: SLUG,
      title: "Crea tu primer directorio",
      difficulty: "basic",
      instructions:
        "Crea un directorio llamado practicas dentro de tu carpeta personal y, dentro de él, otro llamado tema-03.",
      topic_id: topicId,
      max_score: 100,
      source: "bank",
      active: true,
      checks: { create: CHECKS },
    },
    include: { checks: true },
  })
  console.log("Actividad sembrada:", activity.slug, "con", activity.checks.length, "aserciones")
}

main()
  .catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
