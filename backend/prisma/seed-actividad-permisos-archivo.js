const prisma = require("./client")

const SLUG = "cada-archivo-en-su-sitio"
const RAIZ = "/home/$usuario/actividades/cada-archivo-en-su-sitio"

/**
 * Los cuatro archivos llegan con los permisos que da el sistema por defecto
 * (664 bajo la umask del laboratorio). Ninguno coincide con lo que se pide, de
 * modo que no hay aserciones regaladas al abrir la actividad.
 *
 * El enunciado describe para que sirve cada archivo y no que numero ponerle:
 * traducir el proposito a permisos es el ejercicio. Cada descripcion admite un
 * unico modo, asi que no hay ambiguedad al corregir.
 */
const SETUP = {
  files: [
    { path: "notas.txt", content: "Apuntes sueltos del laboratorio\n" },
    { path: "informe.txt", content: "Informe de la practica\n" },
    { path: "arranque.sh", content: "#!/bin/bash\necho \"laboratorio listo\"\n" },
    { path: "plantilla.txt", content: "Plantilla oficial, no modificar\n" },
  ],
}

const CHECKS = [
  { type: "permisos_son", params: { ruta: `${RAIZ}/notas.txt`, modo: "600" }, points: 25, position: 0 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/informe.txt`, modo: "644" }, points: 25, position: 1 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/arranque.sh`, modo: "755" }, points: 25, position: 2 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/plantilla.txt`, modo: "444" }, points: 25, position: 3 },
]

const DATOS = {
  title: "Cada archivo en su sitio",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Cuatro archivos llegaron con los permisos que da el sistema. Deja cada uno " +
    "con los que pide su descripción.",
  topic_number: 5,
  max_score: 100,
  setup: SETUP,
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
