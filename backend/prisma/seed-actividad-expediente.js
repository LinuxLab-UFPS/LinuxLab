const prisma = require("./client")

const SLUG = "expediente-empleado"
const RAIZ = "/home/$usuario/actividades/expediente-empleado"

const SETUP = {
  dirs: [
    "temporal",
    "mezclado",
    "RESPALDO_VIEJO",
  ],
  files: [
    { path: "temporal/cache_001.tmp", content: "cache temporal del sistema\n" },
    { path: "temporal/cache_002.tmp", content: "cache temporal del sistema\n" },
    { path: "temporal/cache_003.tmp", content: "cache temporal del sistema\n" },
    { path: "temporal/registro.bak", content: "respaldo de registro antiguo\n" },
    { path: "mezclado/foto_perfil.jpg", content: "(imagen de perfil)\n" },
    { path: "mezclado/foto_equipo.jpg", content: "(imagen del equipo)\n" },
    { path: "mezclado/presupuesto.xlsx", content: "(hoja de calculo)\n" },
    { path: "mezclado/notas_reunion.txt", content: "Notas de la reunion del 15 de enero\n" },
    { path: "mezclado/borrador.txt", content: "esto es un borrador que no sirve\n" },
    { path: "mezclado/contrato.pdf", content: "(documento de contrato)\n" },
    { path: "RESPALDO_VIEJO/datos_2024.csv", content: "enero,100\nfebrero,200\n" },
    { path: "LEEME.txt", content: "Directorio del proyecto - organizado por sistemas\n" },
  ],
}

const CHECKS = [
  // Estructura: mkdir para la jaula nueva. El dir de respaldos vale mas: es el
  // que mas pasos exige (cp -r de un directorio).
  {
    type: "directorio_existe",
    params: { ruta: `${RAIZ}/archivos` },
    points: 6,
    position: 0,
  },
  {
    type: "directorio_existe",
    params: { ruta: `${RAIZ}/archivos/fotos` },
    points: 6,
    position: 1,
  },
  {
    type: "directorio_existe",
    params: { ruta: `${RAIZ}/archivos/documentos` },
    points: 6,
    position: 2,
  },
  {
    type: "directorio_existe",
    params: { ruta: `${RAIZ}/archivos/respaldos/RESPALDO_VIEJO` },
    points: 8,
    position: 3,
  },
  // Los archivos van con su CONTENIDO (archivo_contiene), no con archivo_existe:
  // en un ejercicio de mover, un `touch` de un archivo vacio aprobaria la
  // excistencia sin haber movido nada. Los patrones son el contenido exacto
  // que setup.py deja en cada original.
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/archivos/fotos/foto_perfil.jpg`, patron: "(imagen de perfil)" },
    points: 7,
    position: 4,
  },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/archivos/fotos/foto_equipo.jpg`, patron: "(imagen del equipo)" },
    points: 7,
    position: 5,
  },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/archivos/documentos/presupuesto.xlsx`, patron: "(hoja de calculo)" },
    points: 7,
    position: 6,
  },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/archivos/documentos/notas_reunion.txt`, patron: "Notas de la reunion del 15 de enero" },
    points: 7,
    position: 7,
  },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/archivos/documentos/contrato.pdf`, patron: "(documento de contrato)" },
    points: 8,
    position: 8,
  },
  // El informe lleva el dato del CSV original: comprueba a la vez el renombre y
  // el mv (si el estudiante monto un archivo vacio a mano, no pasa).
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/archivos/documentos/informe_final.csv`, patron: "enero,100" },
    points: 10,
    position: 9,
  },
  // La copia del paso 4 debe conservar su datos_2024.csv: el que hace el mv
  // antes de copiar entrega respaldos vacios y no pasa. Es el orden del
  // enunciado hecho asercion.
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/archivos/respaldos/RESPALDO_VIEJO/datos_2024.csv`, patron: "febrero,200" },
    points: 8,
    position: 10,
  },
  // Limpieza: temporal/ y mezclado/ se van por completo, el borrador muere en
  // documentos y el RESPALDO_VIEJO original queda vacio y se elimina.
  {
    type: "archivo_no_existe",
    params: { ruta: `${RAIZ}/temporal` },
    points: 5,
    position: 11,
  },
  {
    type: "archivo_no_existe",
    params: { ruta: `${RAIZ}/mezclado` },
    points: 5,
    position: 12,
  },
  {
    type: "archivo_no_existe",
    params: { ruta: `${RAIZ}/archivos/documentos/borrador.txt` },
    points: 5,
    position: 13,
  },
  {
    type: "archivo_no_existe",
    params: { ruta: `${RAIZ}/RESPALDO_VIEJO` },
    points: 5,
    position: 14,
  },
]

const TOPIC_NUMBER = 4
const SUBTOPIC_SLUG = "copiar-borrar"

const DATOS = {
  title: "El expediente del empleado",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Organiza el servidor desordenado del empleado anterior. Crea una nueva " +
    "estructura con archivos/fotos, archivos/documentos y archivos/respaldos. " +
    "Mueve los archivos a su lugar; copia el respaldo viejo (sin mover el original) " +
    "y SOLO despues renombra y mueve el CSV del original con un solo mv; elimina " +
    "temporales, el borrador y los directorios vacios.",
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
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
