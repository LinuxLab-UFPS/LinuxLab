const prisma = require("./client")

const SLUG = "permisos-por-escrito"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

/**
 * Escribir permisos en vez de aplicarlos.
 *
 * Todas las demas actividades de permisos piden un `chmod`, y `chmod 755` se
 * salta el paso que aqui se practica: traducir un requisito en palabras a los
 * diez caracteres que el sistema enseña. Al no poder aplicarlo, la unica salida
 * es entender la notacion.
 *
 * El archivo se comprueba con `archivo_contiene`, que compara texto LITERAL, no
 * expresiones regulares. Por eso cada asercion busca la linea entera ya
 * rellenada: asi tambien se verifica que el estudiante no reescribio el formato
 * que el script del colega espera leer.
 */

/* Las tres lineas tal como quedan al resolverla. El nombre y el `PERMISOS =`
   forman parte de la cadena buscada, que es lo que ata la respuesta a su fila:
   con solo el permiso, tres aciertos en el orden equivocado tambien pasarian. */
const ESPERADO = {
  "desplegar.sh": "-rwxr-xr-x",
  "leeme.txt": "-rw-r--r--",
  config: "drwx------",
}

const linea = (archivo, valor) => `"${archivo}" PERMISOS = "${valor}"`

const PLANTILLA = [
  linea("desplegar.sh", "Escribe aqui"),
  linea("leeme.txt", "Escribe aqui"),
  linea("config", "Escribe aqui"),
  "",
  "Mi script solo admite permisos simbolicos, de los que son asi: -r-xr-x-wx",
  "~ Mauricio",
  "",
].join("\n")

const SETUP = {
  dirs: ["config"],
  files: [
    { path: "permisos.txt", content: PLANTILLA },
    { path: "desplegar.sh", content: "#!/bin/bash\necho \"desplegando\"\n" },
    { path: "leeme.txt", content: "Instrucciones del proyecto.\n" },
    { path: "config/credenciales.txt", content: "clave = no-mirar\n" },
  ],
}

const CHECKS = Object.entries(ESPERADO).map(([archivo, valor], i) => ({
  type: "archivo_contiene",
  params: { ruta: `${RAIZ}/permisos.txt`, patron: linea(archivo, valor) },
  points: [34, 33, 33][i],
  position: i,
}))

const TOPIC_NUMBER = 5
const SUBTOPIC_SLUG = "chmod"

const DATOS = {
  title: "Permisos por escrito",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Un colega necesita cambiar unos permisos y no sabe cómo. Escríbelos por " +
    "él en permisos.txt, en notación simbólica.",
  setup: SETUP,
}

async function main() {
  const topic = await prisma.topic.findUnique({ where: { order_number: TOPIC_NUMBER } })
  if (!topic) throw new Error(`Topic ${TOPIC_NUMBER} no encontrado. Corre seed-temario primero.`)

  const subtopic = await prisma.subtopic.findUnique({
    where: { topic_id_slug: { topic_id: topic.id, slug: SUBTOPIC_SLUG } },
  })

  const activity = await prisma.topicActivity.upsert({
    where: { slug: SLUG },
    update: { ...DATOS, topic_id: topic.id, subtopic_id: subtopic?.id ?? null, checks: CHECKS },
    create: { slug: SLUG, ...DATOS, topic_id: topic.id, subtopic_id: subtopic?.id ?? null, checks: CHECKS },
  })

  console.log(`Actividad sembrada: ${activity.slug} (topic ${TOPIC_NUMBER}, subtopic ${SUBTOPIC_SLUG})`)
  for (const [archivo, valor] of Object.entries(ESPERADO)) {
    console.log(`  ${archivo.padEnd(14)} ${valor}`)
  }
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
