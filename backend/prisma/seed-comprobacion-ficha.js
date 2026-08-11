const prisma = require("./client")

const SLUG = "ficha-personal"

/**
 * El nombre del archivo sale del codigo del estudiante y la ultima linea de su
 * correo. Ninguno de los dos lo conoce el contenedor: los sustituye el backend
 * leyendolos de la base, de modo que cada estudiante recibe su propia ficha y
 * no puede copiar la del compañero.
 *
 * La primera linea (el nombre) no se revisa a proposito: comparar nombres
 * escritos a mano genera falsos negativos por tildes, mayusculas y segundos
 * apellidos.
 */
const RUTA = "/home/$usuario/$codigo.txt"

/** Nombre + tres comandos + correo. */
const LINEAS_MINIMAS = 5

const CHECKS = [
  {
    type: "archivo_existe",
    params: { ruta: RUTA },
    points: 34,
    position: 0,
  },
  {
    type: "minimo_lineas",
    params: { ruta: RUTA, cantidad: String(LINEAS_MINIMAS) },
    points: 33,
    position: 1,
  },
  {
    type: "ultima_linea_es",
    params: { ruta: RUTA, valor: "$correo" },
    points: 33,
    position: 2,
  },
]

async function main() {
  const activity = await prisma.activityDefinition.upsert({
    where: { slug: SLUG },
    update: {
      title: "Tu ficha en el laboratorio",
      kind: "check",
      difficulty: "basic",
      instructions:
        "Crea un archivo con tu código estudiantil como nombre y edítalo con vi: " +
        "tu nombre en la primera línea, tres comandos aprendidos en las siguientes " +
        "y tu correo institucional al final.",
      topic_number: 4,
      max_score: 100,
      checks: { deleteMany: {}, create: CHECKS },
    },
    create: {
      slug: SLUG,
      title: "Tu ficha en el laboratorio",
      kind: "check",
      difficulty: "basic",
      instructions:
        "Crea un archivo con tu código estudiantil como nombre y edítalo con vi: " +
        "tu nombre en la primera línea, tres comandos aprendidos en las siguientes " +
        "y tu correo institucional al final.",
      topic_number: 4,
      max_score: 100,
      source: "bank",
      active: true,
      checks: { create: CHECKS },
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
