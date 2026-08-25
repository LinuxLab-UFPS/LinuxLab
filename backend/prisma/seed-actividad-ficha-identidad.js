const prisma = require("./client")

const SLUG = "tu-ficha-de-identidad"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

/**
 * La actividad facil del tema 8.
 *
 * La cuenta del laboratorio no es administradora, asi que crear usuarios o
 * grupos esta descartado. Lo que si se puede hacer, y es lo que de verdad se
 * usa a diario, es LEER la identidad propia y saber de que archivo sale cada
 * dato.
 *
 * Las aserciones no pueden nombrar al estudiante: `$usuario` solo se sustituye
 * en las rutas, no dentro de un patron. Por eso se buscan trozos estables que
 * solo aparecen si el comando se ejecuto de verdad: `uid=` sale de `id`, el
 * prefijo `grp_` es el grupo del curso, y el septimo campo de `/etc/passwd`
 * hay que recortarlo, que es donde entra `cut`.
 */

const CHECKS = [
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/identidad.txt`, patron: "uid=" },
    points: 25,
    position: 0,
  },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/identidad.txt`, patron: "grp_" },
    points: 25,
    position: 1,
  },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/cuenta.txt`, patron: "/bin/bash" },
    points: 25,
    position: 2,
  },
  {
    type: "archivo_es",
    params: { ruta: `${RAIZ}/shell.txt`, valor: "/bin/bash" },
    points: 25,
    position: 3,
  },
]

const DATOS = {
  title: "Tu ficha de identidad",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Deja por escrito quién eres para el sistema: tu identidad completa, tu " +
    "línea de /etc/passwd y, recortado de ella, el shell con el que entras.",
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
