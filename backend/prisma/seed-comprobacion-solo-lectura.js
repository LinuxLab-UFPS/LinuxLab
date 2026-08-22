const prisma = require("./client")

const SLUG = "archivo-solo-lectura"
const RUTA = "/home/$usuario/solo-lectura.txt"

/**
 * Lo que se mide es el estado final, no el recorrido: el evaluador mira la
 * carpeta una vez, no observa lo que el estudiante fue haciendo. Por eso el
 * archivo tiene que seguir existiendo cuando se comprueba, y el borrado se
 * queda como paso posterior en la leccion en lugar de ser una asercion.
 *
 * Las dos lineas son la prueba de que se escribio antes de retirar el permiso:
 * un archivo vacio en 444 se consigue con un `touch` y un `chmod`, sin pasar
 * por el editor ni por el problema que el ejercicio quiere enseñar.
 *
 * El modo se exige exacto. `chmod a-w` sobre un archivo recien creado deja
 * 444, y un estudiante que solo se lo quite a si mismo vera en el fallo los
 * permisos que le salieron, que es la mitad de la leccion.
 */
const CHECKS = [
  { type: "archivo_existe", params: { ruta: RUTA }, points: 34, position: 0 },
  { type: "minimo_lineas", params: { ruta: RUTA, cantidad: "2" }, points: 33, position: 1 },
  { type: "permisos_son", params: { ruta: RUTA, modo: "444" }, points: 33, position: 2 },
]

const DATOS = {
  title: "Un archivo de solo lectura",
  difficulty: "basic",
  instructions:
    "Crea solo-lectura.txt en tu directorio personal con al menos dos líneas " +
    "escritas en vi, y retírale el permiso de escritura a los tres bloques.",
  max_score: 100,
}

async function main() {
  DATOS.topic_id = (await prisma.topic.findFirst({ where: { number: 5 }, select: { id: true } })).id
  const activity = await prisma.activityDefinition.upsert({
    where: { slug: SLUG },
    update: { ...DATOS, checks: { deleteMany: {}, create: CHECKS } },
    create: { slug: SLUG, ...DATOS, source: "bank", active: true, checks: { create: CHECKS } },
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
