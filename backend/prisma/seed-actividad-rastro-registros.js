const prisma = require("./client")

const SLUG = "rastro-en-los-registros"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

/**
 * La actividad facil del tema 7: encontrar una linea entre cientos.
 *
 * El comprobador solo mira archivos, asi que lo que se evalua no es el comando
 * sino su resultado escrito. Las dos respuestas estan elegidas para que leer a
 * ojo no compense:
 *
 *   - la linea de ERROR esta sola entre 95 lineas de relleno repartidas en tres
 *     archivos, y hay que dejarla EXACTA, sin el nombre del archivo delante
 *     (que es lo que ensena la opcion -h de grep),
 *   - el recuento de AVISO cruza los tres archivos, asi que un `grep -c` sobre
 *     uno solo da un numero equivocado.
 */

const ERROR = "ERROR fallo critico en el modulo de pagos"

/** Siete AVISO repartidos: tres, dos y dos. El total es la respuesta. */
const SETUP = {
  dirs: ["registros"],
  files: [
    {
      path: "registros/lunes.log",
      lines: 40,
      fill: "INFO peticion atendida",
      at: {
        5: "AVISO disco al 80 por ciento",
        12: "AVISO memoria por encima de lo normal",
        27: ERROR,
        33: "AVISO reintento programado",
      },
    },
    {
      path: "registros/martes.log",
      lines: 30,
      fill: "INFO cache renovada",
      at: { 8: "AVISO cola de envios llena", 19: "AVISO conexion lenta" },
    },
    {
      path: "registros/miercoles.log",
      lines: 25,
      fill: "INFO sesion iniciada",
      at: {
        3: "AVISO certificado por vencer",
        14: "AVISO espacio bajo en disco",
      },
    },
  ],
}

const CHECKS = [
  { type: "archivo_es", params: { ruta: `${RAIZ}/hallazgo.txt`, valor: ERROR }, points: 50, position: 0 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/cuenta.txt`, valor: "7" }, points: 50, position: 1 },
]

const DATOS = {
  title: "El rastro en los registros",
  kind: "activity",
  difficulty: "basic",
  instructions:
    "Tres bitácoras y una sola línea que importa. Sácala con grep y cuenta " +
    "cuántos avisos hay en total.",
  topic_number: 7,
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
