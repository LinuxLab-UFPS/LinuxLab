/**
 * La practica del subtema de directorios. Se siembra con `slug` para que la
 * leccion la invoque por nombre y no por id.
 */
const prisma = require("./client")

const SLUG = "crear-directorio-practicas"

async function main() {
  const existing = await prisma.activity.findUnique({ where: { slug: SLUG } })
  if (existing) {
    console.log("La actividad ya existe:", existing.id)
    return
  }

  const activity = await prisma.activity.create({
    data: {
      slug: SLUG,
      title: "Crea tu primer directorio",
      instructions:
        "Crea un directorio llamado practicas dentro de tu carpeta personal y, dentro de él, otro llamado tema-03.",
      topic_number: 3,
      max_score: 100,
      checks: {
        create: [
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
        ],
      },
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
