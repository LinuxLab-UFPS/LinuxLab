const prisma = require("./client")

const SLUG = "tu-primer-guion"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

/**
 * La actividad facil del tema 10.
 *
 * Es la que mejor encaja con el comprobador de todo el curso, porque un script
 * deja DOS rastros en el disco: el archivo en si y lo que produce al correr. Se
 * comprueban los dos a la vez, y esa pareja es la que cierra el atajo: escribir
 * `salida.txt` a mano no crea el script, y crear el script sin ejecutarlo no
 * crea `salida.txt`.
 *
 * La ultima linea lleva `$codigo`, que el backend sustituye por el codigo del
 * estudiante antes de evaluar. Asi la respuesta correcta es distinta para cada
 * uno y copiarla del companero no sirve.
 */

const CHECKS = [
  { type: "archivo_existe", params: { ruta: `${RAIZ}/saludo.sh` }, points: 20, position: 0 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/saludo.sh`, modo: "755" }, points: 25, position: 1 },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/saludo.sh`, patron: "#!/bin/bash" },
    points: 25,
    position: 2,
  },
  {
    type: "ultima_linea_es",
    params: { ruta: `${RAIZ}/salida.txt`, valor: "$codigo" },
    points: 30,
    position: 3,
  },
]

const DATOS = {
  title: "Tu primer guion",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Escribe un script con su cabecera, dale permiso de ejecución y haz que " +
    "al correrlo deje tu código estudiantil escrito en un archivo.",
  topic_number: 10,
  max_score: 100,
}

async function main() {
  const a = await prisma.activityDefinition.upsert({
    where: { slug: SLUG },
    update: { ...DATOS, checks: { deleteMany: {}, create: CHECKS } },
    create: { slug: SLUG, ...DATOS, source: "bank", active: true, checks: { create: CHECKS } },
    include: { checks: true },
  })
  console.log(`Actividad sembrada: ${a.slug} con ${a.checks.length} aserciones`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
