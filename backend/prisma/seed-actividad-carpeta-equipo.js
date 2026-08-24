const prisma = require("./client")

const SLUG = "la-carpeta-del-equipo"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

/**
 * La actividad intermedia del tema 8: el directorio compartido con setgid.
 *
 * Se puede hacer entera dentro del laboratorio porque cada cuenta pertenece a
 * dos grupos, el primario (que se llama como la cuenta) y el del curso. La
 * herencia solo se nota cuando el directorio pertenece a un grupo DISTINTO del
 * primario, y eso es justo lo que hay.
 *
 * No existe una asercion de grupo, asi que el grupo se comprueba de dos formas
 * indirectas que juntas no se pueden falsificar con un `mkdir`:
 *
 *   - `permisos_son 2770` exige el bit setgid puesto (el 2 de delante),
 *   - `prueba.txt` tiene que contener `grp_`, y ahi solo llega el prefijo del
 *     grupo del curso si se vuelca el `ls -l` del archivo heredado.
 */

const CHECKS = [
  { type: "directorio_existe", params: { ruta: `${RAIZ}/equipo` }, points: 20, position: 0 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/equipo`, modo: "2770" }, points: 30, position: 1 },
  { type: "archivo_existe", params: { ruta: `${RAIZ}/equipo/acta.txt` }, points: 20, position: 2 },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/prueba.txt`, patron: "grp_" },
    points: 30,
    position: 3,
  },
]

const DATOS = {
  title: "La carpeta del equipo",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Monta una carpeta compartida de verdad: del grupo del curso, cerrada a " +
    "los de fuera y con setgid, para que todo lo que nazca dentro herede el " +
    "grupo. Y deja la prueba de que funcionó.",
  topic_number: 8,
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
