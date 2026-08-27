const prisma = require("./client")

/**
 * Retirar actividades que ya no existen.
 *
 * Los seeds hacen `upsert` por slug, asi que crean y actualizan pero nunca
 * borran. Cuando una actividad se elimina (`cerrar-el-proyecto`) o cambia de
 * slug (`limpieza-con-comodines` -> `limpieza`), la fila vieja se queda en la
 * base y sigue apareciendo, ahora sin enunciado que la acompañe.
 *
 * Este seed las retira. No borra a ciegas: `TopicSubmission` cuelga de la
 * actividad, asi que una con entregas se deja donde esta y se avisa, porque
 * llevarsela por delante borraria notas de estudiantes. En una base de
 * desarrollo no habra ninguna; en produccion es la diferencia entre limpiar y
 * perder datos.
 */
const RETIRADAS = [
  "cerrar-el-proyecto",
  "limpieza-con-comodines",
  "rastro-en-los-registros",
]

async function main() {
  for (const slug of RETIRADAS) {
    const actividad = await prisma.topicActivity.findUnique({
      where: { slug },
      select: { id: true, _count: { select: { submissions: true } } },
    })

    if (!actividad) {
      console.log(`  ${slug.padEnd(24)} no esta en la base`)
      continue
    }

    if (actividad._count.submissions > 0) {
      console.log(
        `  ${slug.padEnd(24)} SE DEJA: tiene ${actividad._count.submissions} entrega(s)`,
      )
      continue
    }

    await prisma.topicActivity.delete({ where: { id: actividad.id } })
    console.log(`  ${slug.padEnd(24)} retirada`)
  }
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
