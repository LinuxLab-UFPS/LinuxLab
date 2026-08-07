const prisma = require("./client")

const SLUG = "logo-ufps"
const RUTA = "/home/$usuario/logo.txt"

/**
 * Tres filas del logo, no una: con una sola, pegar ese renglon repetido bastaria
 * para aprobar. Las de rojo solido quedan fuera por lo mismo. Si el snippet del
 * frontend cambia (lib/features/shared/snippets.ts), estas hay que actualizarlas.
 */
const FILAS = [
  "🟥⬜🟥⬜🟥⬜⬜⬜🟥⬜⬜⬜🟥⬜⬜⬜🟥",
  "🟥⬜🟥⬜🟥⬜⬜🟥🟥⬜⬜⬜🟥⬜⬜⬜🟥",
  "🟥⬜⬜⬜🟥⬜🟥🟥🟥⬜🟥🟥🟥⬜⬜⬜🟥",
]

async function main() {
  await prisma.activity.deleteMany({ where: { slug: SLUG } })

  const checks = [
    { type: "archivo_existe", params: { ruta: RUTA }, points: 25, position: 0 },
    ...FILAS.map((patron, i) => ({
      type: "archivo_contiene",
      params: { ruta: RUTA, patron },
      points: 25,
      position: i + 1,
    })),
  ]

  const activity = await prisma.activity.create({
    data: {
      slug: SLUG,
      title: "Guarda el logo",
      kind: "check",
      difficulty: "basic",
      instructions:
        "Copia el logo con el botón de la lección y guárdalo en un archivo " +
        "llamado logo.txt en tu carpeta personal.",
      topic_number: 4,
      max_score: 100,
      checks: { create: checks },
    },
    include: { checks: true },
  })

  console.log(`Comprobacion sembrada: ${activity.slug} con ${activity.checks.length} aserciones`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
