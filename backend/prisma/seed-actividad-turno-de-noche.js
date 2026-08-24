const prisma = require("./client")

const SLUG = "el-turno-de-noche"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

/**
 * La actividad intermedia del tema 9: abrir trabajos en segundo plano, mirarlos
 * y cerrar uno.
 *
 * El problema de disenar esto es que el comprobador no ve procesos, y ademas no
 * hay una asercion de "este archivo NO contiene X", asi que no se puede
 * demostrar que algo se cerro por ausencia.
 *
 * La salida es hacer que el estudiante CUENTE. `restantes.txt` tiene que decir
 * exactamente 2, y ese numero solo sale si se abrieron tres trabajos y se cerro
 * uno: con tres abiertos da 3 y con ninguno da 0. Un numero exacto convierte
 * una comprobacion de presencia en una de estado.
 *
 * Los limites del entorno mandan sobre las cifras: `ulimit -u 16` deja poco
 * margen, asi que son tres trabajos y no diez, y `TMOUT=900` cierra la sesion
 * a los quince minutos, asi que las esperas son largas pero no eternas.
 */

const CHECKS = [
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/trabajos.txt`, patron: "sleep" },
    points: 30,
    position: 0,
  },
  {
    type: "minimo_lineas",
    params: { ruta: `${RAIZ}/trabajos.txt`, cantidad: 3 },
    points: 30,
    position: 1,
  },
  { type: "archivo_es", params: { ruta: `${RAIZ}/restantes.txt`, valor: "2" }, points: 40, position: 2 },
]

const DATOS = {
  title: "El turno de noche",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Deja tres tareas corriendo en segundo plano, apunta cuáles son, cierra " +
    "una y cuenta las que quedan.",
  topic_number: 9,
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
