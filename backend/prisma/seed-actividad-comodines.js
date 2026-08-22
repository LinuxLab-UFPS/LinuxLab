const prisma = require("./client")

const SLUG = "limpieza-con-comodines"
const RAIZ = "/home/$usuario/actividades/limpieza-con-comodines"

/**
 * El estudiante trabaja sobre un arbol preparado, no sobre sus propios archivos.
 * Por eso la actividad puede pedirle que borre a lo bestia: si se equivoca,
 * recarga y vuelve a empezar sin haber perdido nada suyo.
 *
 * El arbol se declara como datos. El backend se lo pasa a setup.py, que decide
 * que hacer con el; en ningun momento se ejecuta texto escrito aqui.
 */
const SETUP = {
  dirs: ["documentos", "imagenes"],
  files: [
    { path: "informe.txt", content: "Informe de laboratorio\n" },
    { path: "notas.txt", content: "Apuntes de clase\n" },
    { path: "resumen.txt", content: "Resumen del tema\n" },
    { path: "captura1.png", content: "(imagen de prueba)\n" },
    { path: "captura2.png", content: "(imagen de prueba)\n" },
    { path: "diagrama.png", content: "(imagen de prueba)\n" },
    { path: "temporal.tmp", content: "basura\n" },
    { path: "cache.tmp", content: "basura\n" },
    { path: "sesion.tmp", content: "basura\n" },
  ],
}

/** Ninguna de las cinco se cumple al empezar: si alguna naciera en verde, el
 *  estudiante veria puntos regalados antes de tocar nada. */
const CHECKS = [
  { type: "archivo_no_existe", params: { ruta: `${RAIZ}/temporal.tmp` }, points: 20, position: 0 },
  { type: "archivo_no_existe", params: { ruta: `${RAIZ}/cache.tmp` }, points: 20, position: 1 },
  { type: "archivo_existe", params: { ruta: `${RAIZ}/documentos/informe.txt` }, points: 20, position: 2 },
  { type: "archivo_existe", params: { ruta: `${RAIZ}/documentos/notas.txt` }, points: 20, position: 3 },
  // Los .png tienen que llegar enteros a imagenes, asi que un `rm *` de mas
  // deja esta sin cumplir y no hay forma de recuperarla.
  { type: "archivo_existe", params: { ruta: `${RAIZ}/imagenes/captura1.png` }, points: 20, position: 4 },
]

async function main() {
  const topicId = (await prisma.topic.findFirst({ where: { number: 4 }, select: { id: true } })).id
  const activity = await prisma.activityDefinition.upsert({
    where: { slug: SLUG },
    update: {
      title: "Limpieza con comodines",
      difficulty: "basic",
      instructions:
        "Borra los .tmp de la carpeta de la actividad, mueve los .txt a " +
        "documentos y los .png a imagenes.",
      topic_id: topicId,
      max_score: 100,
      setup: SETUP,
      checks: { deleteMany: {}, create: CHECKS },
    },
    create: {
      slug: SLUG,
      title: "Limpieza con comodines",
      difficulty: "basic",
      instructions:
        "Borra los .tmp de la carpeta de la actividad, mueve los .txt a " +
        "documentos y los .png a imagenes.",
      topic_id: topicId,
      max_score: 100,
      setup: SETUP,
      source: "bank",
      active: true,
      checks: { create: CHECKS },
    },
    include: { checks: true },
  })

  console.log(`Actividad sembrada: ${activity.slug} con ${activity.checks.length} aserciones`)
  console.log(`  arbol: ${SETUP.files.length} archivos y ${SETUP.dirs.length} carpeta`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
