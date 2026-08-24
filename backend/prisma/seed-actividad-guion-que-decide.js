const prisma = require("./client")

const SLUG = "el-guion-que-decide"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

/**
 * La actividad intermedia del tema 10: un ciclo y un condicional en el mismo
 * script.
 *
 * Las cifras del arbol estan puestas para que el resultado sea determinista y
 * para que el condicional tenga que decidir de verdad: 12 + 30 + 8 son 50, por
 * encima del umbral de 40, asi que la ultima linea es REVISAR. Un script que
 * ignore el `if` y escriba siempre OK falla esa asercion.
 *
 * `alfa.log: 12` es la trampa contra el atajo: ese numero no aparece escrito en
 * ninguna parte del arbol, solo sale de contar las lineas del archivo. Y el
 * orden alfabetico de `datos/*.log` hace que el recorrido sea siempre el mismo.
 *
 * Se comprueban tambien `for` e `if` dentro del script, porque el enunciado
 * pide las dos estructuras y sin ellas el resultado se puede escribir a mano.
 */

const SETUP = {
  dirs: ["datos"],
  files: [
    { path: "datos/alfa.log", lines: 12, fill: "INFO tarea completada" },
    { path: "datos/beta.log", lines: 30, fill: "INFO lote procesado" },
    { path: "datos/gamma.log", lines: 8, fill: "INFO sincronizacion" },
    { path: "datos/leeme.txt", content: "Solo cuentan los .log de esta carpeta.\n" },
  ],
}

const CHECKS = [
  { type: "archivo_existe", params: { ruta: `${RAIZ}/reporte.sh` }, points: 15, position: 0 },
  { type: "permisos_son", params: { ruta: `${RAIZ}/reporte.sh`, modo: "755" }, points: 15, position: 1 },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/reporte.sh`, patron: "for" },
    points: 10,
    position: 2,
  },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/reporte.sh`, patron: "if" },
    points: 10,
    position: 3,
  },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/reporte.txt`, patron: "alfa.log: 12" },
    points: 20,
    position: 4,
  },
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/reporte.txt`, patron: "TOTAL: 50" },
    points: 15,
    position: 5,
  },
  {
    type: "ultima_linea_es",
    params: { ruta: `${RAIZ}/reporte.txt`, valor: "REVISAR" },
    points: 15,
    position: 6,
  },
]

const DATOS = {
  title: "El guion que decide",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Un script que recorra las bitácoras, cuente sus líneas y decida al final " +
    "si el total pasa del umbral.",
  topic_number: 10,
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
