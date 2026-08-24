const prisma = require("./client")

const SLUG = "foto-del-sistema"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

/**
 * La actividad facil del tema 9.
 *
 * Aqui hay una restriccion de fondo: el comprobador mira la carpeta UNA vez,
 * cuando se pulsa el boton. No ve procesos, no ve historial y no sabe que se
 * tecleo. Cualquier cosa que se quiera evaluar tiene que aterrizar en un
 * archivo, y por eso la actividad es de capturar: la habilidad que se practica
 * es redirigir la salida de las herramientas de procesos, que es lo que se hace
 * en un servidor cuando hay que dejar constancia de un incidente.
 *
 * Los nombres de las dos senales salen de `kill -l <numero>`, que los devuelve
 * SIN el prefijo SIG. Se piden por numero para que haya que consultar la lista.
 */

const CHECKS = [
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/procesos.txt`, patron: "bash" },
    points: 25,
    position: 0,
  },
  {
    type: "minimo_lineas",
    params: { ruta: `${RAIZ}/procesos.txt`, cantidad: 2 },
    points: 25,
    position: 1,
  },
  { type: "archivo_es", params: { ruta: `${RAIZ}/senal-9.txt`, valor: "KILL" }, points: 25, position: 2 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/senal-15.txt`, valor: "TERM" }, points: 25, position: 3 },
]

const DATOS = {
  title: "La foto del sistema",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Deja constancia de lo que está corriendo en tu cuenta y averigua cómo se " +
    "llaman las dos señales que más se usan para cerrar un proceso.",
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
