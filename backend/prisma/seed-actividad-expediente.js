const prisma = require("./client")

const SLUG = "expediente-empleado"
const RAIZ = "/home/$usuario/actividades/expediente"

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
    { path: "LEEME.txt", content: "Carpeta del proyecto - organizado por sistemas\n" },
  ],
}

const CHECKS = [
  {
    type: "directorio_existe",
    params: { ruta: `${RAIZ}/archivos` },
    points: 10,
    position: 0,
  },
  {
    type: "directorio_existe",
    params: { ruta: `${RAIZ}/archivos/fotos` },
    points: 10,
    position: 1,
  },
  {
    type: "directorio_existe",
    params: { ruta: `${RAIZ}/archivos/documentos` },
    points: 10,
    position: 2,
  },
  {
    type: "directorio_existe",
    params: { ruta: `${RAIZ}/archivos/respaldos/RESPALDO_VIEJO` },
    points: 15,
    position: 3,
  },
  {
    type: "archivo_existe",
    params: { ruta: `${RAIZ}/archivos/fotos/foto_perfil.jpg` },
    points: 10,
    position: 4,
  },
  {
    type: "archivo_existe",
    params: { ruta: `${RAIZ}/archivos/fotos/foto_equipo.jpg` },
    points: 10,
    position: 5,
  },
  {
    type: "archivo_existe",
    params: { ruta: `${RAIZ}/archivos/documentos/informe_final.csv` },
    points: 15,
    position: 6,
  },
  {
    type: "archivo_no_existe",
    params: { ruta: `${RAIZ}/temporal` },
    points: 10,
    position: 7,
  },
  {
    type: "archivo_no_existe",
    params: { ruta: `${RAIZ}/mezclado` },
    points: 10,
    position: 8,
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
    "Mueve los archivos a su lugar, copia el respaldo viejo, renombra el CSV " +
    "como informe_final.csv y elimina temporales y carpetas vacias.",
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
