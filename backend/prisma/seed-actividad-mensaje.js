const prisma = require("./client")

const SLUG = "mensaje-oculto"
const RAIZ = "/home/$usuario/actividades/mensaje-oculto"

/**
 * Cuatro archivos de cien lineas. Cada uno esconde un trozo de un dibujo, y el
 * reparto lo decide el entorno al preparar la actividad: que archivo lleva que
 * bloque, y si va al principio o al final, cambia entre estudiantes y vuelve a
 * cambiar cada vez que se recarga. Aprenderse el sitio no sirve de nada.
 *
 * Los bloques no miden todos igual, asi que tampoco vale asumir dos lineas.
 *
 * El dibujo usa el bloque lleno U+2588, que no sale de ninguna tecla: escribirlo
 * a mano no es una alternativa a sacarlo del archivo. Comprobar QUE herramienta
 * uso seguiria siendo imposible (lo unico que queda del "como" es el historial,
 * que es del estudiante), pero copiar tampoco sirve: la ultima linea es su
 * codigo.
 */
const SETUP = {
  "shuffle": {
    "files": [
      "bloque-a.txt",
      "bloque-b.txt",
      "bloque-c.txt",
      "bloque-d.txt"
    ],
    "lines": 100,
    "fill": "registro",
    "blocks": [
      [
        "███████████████████",
        "█                 █"
      ],
      [
        "█ █ █ ███ ███ ███ █",
        "█ █ █ █   █ █ █   █"
      ],
      [
        "█ █ █ ██  ███ ███ █",
        "█ █ █ █   █     █ █"
      ],
      [
        "█ ███ █   █   ███ █",
        "█                 █",
        "███████████████████"
      ]
    ]
  }
}

const LOGO = "███████████████████\n█                 █\n█ █ █ ███ ███ ███ █\n█ █ █ █   █ █ █   █\n█ █ █ ██  ███ ███ █\n█ █ █ █   █     █ █\n█ ███ █   █   ███ █\n█                 █\n███████████████████"

async function main() {
  const activity = await prisma.activityDefinition.upsert({
    where: { slug: SLUG },
    update: {
      title: "El mensaje oculto",
      kind: "activity",
      difficulty: "intermediate",
      instructions:
        "Cada archivo esconde un trozo de un dibujo. Reúnelos en logo.txt en el " +
        "orden correcto y firma con tu código en la última línea.",
      topic_number: 4,
      max_score: 100,
      setup: SETUP,
      checks: {
        deleteMany: {},
        create: [
          { type: "archivo_existe", params: { ruta: `${RAIZ}/logo.txt` }, points: 30, position: 0 },
          // Contenido exacto: con `archivo_contiene`, las mismas filas en otro
          // orden aprobarian, y el orden es justo lo que hay que resolver.
          { type: "archivo_es", params: { ruta: `${RAIZ}/logo.txt`, valor: LOGO + "\n$codigo" }, points: 70, position: 1 },
        ],
      },
    },
    create: {
      slug: SLUG,
      title: "El mensaje oculto",
      kind: "activity",
      difficulty: "intermediate",
      instructions:
        "Cada archivo esconde un trozo de un dibujo. Reúnelos en logo.txt en el " +
        "orden correcto y firma con tu código en la última línea.",
      topic_number: 4,
      max_score: 100,
      setup: SETUP,
      source: "bank",
      active: true,
      checks: {
        create: [
          { type: "archivo_existe", params: { ruta: `${RAIZ}/logo.txt` }, points: 30, position: 0 },
          { type: "archivo_es", params: { ruta: `${RAIZ}/logo.txt`, valor: LOGO + "\n$codigo" }, points: 70, position: 1 },
        ],
      },
    },
    include: { checks: true },
  })

  console.log(`Actividad sembrada: ${activity.slug} con ${activity.checks.length} aserciones`)
  console.log(`  ${SETUP.shuffle.files.length} archivos de ${SETUP.shuffle.lines} lineas, repartidos al azar`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
