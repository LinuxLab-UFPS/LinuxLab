const prisma = require("./client")

const SLUG = "cerrar-el-proyecto"
const RAIZ = "/home/$usuario/actividades/cerrar-el-proyecto"

/**
 * Sube el escalon sobre la actividad facil en dos sitios. El primero es el
 * directorio: `config` no se protege con el mismo criterio que un archivo, y
 * sus permisos no dicen nada de los del archivo que hay dentro. El segundo es
 * el borrado, que no depende del permiso del `.tmp` sino del de la carpeta que
 * lo contiene.
 *
 * `respaldo.tmp` existe al empezar, asi que la asercion de ausencia nace sin
 * cumplir en vez de aprobarse sola.
 */
const SETUP = {
  dirs: ["config"],
  files: [
    { path: "desplegar.sh", content: "#!/bin/bash\necho \"desplegando\"\n" },
    { path: "leeme.txt", content: "Proyecto de la practica de permisos\n" },
    { path: "respaldo.tmp", content: "copia temporal, sobra en la entrega\n" },
    { path: "config/credenciales.txt", content: "usuario=lab\nclave=cambiala\n" },
  ],
}

const CHECKS = [
  { type: "permisos_son", params: { ruta: `${RAIZ}/desplegar.sh`, modo: "755" }, points: 20, position: 0 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/leeme.txt`, modo: "644" }, points: 20, position: 1 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/config`, modo: "700" }, points: 20, position: 2 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/config/credenciales.txt`, modo: "600" }, points: 20, position: 3 },
  { type: "archivo_no_existe", params: { ruta: `${RAIZ}/respaldo.tmp` }, points: 20, position: 4 },
]

const DATOS = {
  title: "Cerrar el proyecto",
  difficulty: "intermediate",
  instructions:
    "Deja la carpeta del proyecto lista para entregar: cada archivo y cada " +
    "carpeta con los permisos que le corresponden, y sin sobras.",
  max_score: 100,
  setup: SETUP,
}

async function main() {
  DATOS.topic_id = (await prisma.topic.findFirst({ where: { number: 5 }, select: { id: true } })).id
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
