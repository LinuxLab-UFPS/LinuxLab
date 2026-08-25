const prisma = require("./client")

const SLUG = "paquete-de-entrega"
const RAIZ = "/home/$usuario/actividades/paquete-de-entrega"

/**
 * La actividad de compresion del tema 6: el mismo paquete se crea, se lista y
 * se abre.
 *
 * El comprobador no sabe mirar dentro de un .tar.gz —no hay una asercion para
 * eso—, asi que el contenido del paquete se verifica por sus consecuencias, y
 * cada una exige haber usado una opcion distinta de `tar`:
 *
 *   - `contenido.txt` tiene que nombrar un archivo que solo aparece si el
 *     paquete se armo desde la raiz de la actividad (`-t`),
 *   - `revision/informe/informe.txt` tiene que traer el texto original letra
 *     por letra, y ese texto solo puede llegar ahi saliendo del paquete (`-x`).
 *
 * Un `mkdir` y un `touch` no aprueban ninguna de las dos.
 *
 * El setup no puede dejar un .tar.gz hecho (solo crea carpetas y texto), y por
 * eso la actividad empieza por empaquetar en vez de por extraer.
 */
const INFORME = [
  "Practica de compresion",
  "Autor: estudiante de LinuxLab",
  "Resultado: el archivo pesa menos que la suma de sus partes",
].join("\n") + "\n"

const SETUP = {
  dirs: ["informe"],
  files: [
    { path: "informe/informe.txt", content: INFORME },
    {
      path: "informe/datos.csv",
      content: "archivo,tamano\nregistro-1.log,4096\nregistro-2.log,8192\n",
    },
    { path: "informe/notas.txt", content: "Revisar las cifras antes de entregar.\n" },
    { path: "borrador.tmp", content: "borrador viejo, no va en la entrega\n" },
  ],
}

const CHECKS = [
  { type: "archivo_existe", params: { ruta: `${RAIZ}/entrega.tar.gz` }, points: 20, position: 0 },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/contenido.txt`, patron: "informe/datos.csv" },
    points: 20,
    position: 1,
  },
  { type: "directorio_existe", params: { ruta: `${RAIZ}/revision/informe` }, points: 20, position: 2 },
  {
    type: "archivo_es",
    params: { ruta: `${RAIZ}/revision/informe/informe.txt`, valor: INFORME },
    points: 20,
    position: 3,
  },
  { type: "archivo_no_existe", params: { ruta: `${RAIZ}/borrador.tmp` }, points: 20, position: 4 },
]

const DATOS = {
  title: "El paquete de entrega",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Empaqueta la carpeta del informe en un .tar.gz, deja por escrito qué " +
    "trae dentro, comprueba que el paquete abre extrayéndolo en otra carpeta " +
    "y quita lo que no se entrega.",
  topic_number: 6,
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
