const prisma = require("./client")

const SLUG = "universidad-facultades"
const FACULTADES = ["ingenieria", "enfermeria", "arquitectura"]
const RAIZ = "/home/$usuario/universidad"

/**
 * Aserciones de la practica: primero la raiz, luego una facultad por directorio
 * y su pensum. El puntaje se reparte parejo y el sobrante queda en la raiz, que
 * es de la que cuelga todo lo demas.
 */
function checks() {
  const list = [{ type: "directorio_existe", params: { ruta: RAIZ } }]
  for (const facultad of FACULTADES) {
    list.push({ type: "directorio_existe", params: { ruta: `${RAIZ}/${facultad}` } })
  }
  for (const facultad of FACULTADES) {
    list.push({ type: "archivo_existe", params: { ruta: `${RAIZ}/${facultad}/pensum.txt` } })
  }

  const each = Math.floor(100 / list.length)
  return list.map((check, i) => ({
    ...check,
    position: i,
    points: i === 0 ? 100 - each * (list.length - 1) : each,
  }))
}

async function main() {
  const data = checks()

  await prisma.activity.deleteMany({ where: { slug: SLUG } })
  const activity = await prisma.activity.create({
    data: {
      slug: SLUG,
      title: "Construye una universidad",
      instructions:
        "Crea el directorio universidad en tu carpeta personal, con las facultades " +
        "ingenieria, enfermeria y arquitectura dentro, y un pensum.txt en cada una.",
      topic_number: 4,
      max_score: 100,
      checks: { create: data },
    },
    include: { checks: true },
  })

  console.log(`Actividad sembrada: ${activity.slug} con ${activity.checks.length} aserciones`)
  for (const check of activity.checks.sort((a, b) => a.position - b.position)) {
    console.log(`  ${check.points} pts · ${check.type} · ${check.params.ruta}`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
