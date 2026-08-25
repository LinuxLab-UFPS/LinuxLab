const prisma = require("./client")

const SLUG = "el-arbol-del-proyecto"
const RAIZ = `/home/$usuario/actividades/${SLUG}`

/**
 * La actividad intermedia del tema 7: las tres herramientas del tema sobre el
 * mismo arbol, una por pregunta.
 *
 *   - `configs.txt` obliga a recorrer subdirectorios buscando por nombre, que
 *     es lo que `find` hace y `ls` no,
 *   - `total.txt` no esta escrito en ninguna parte: sale de sumar las lineas de
 *     archivos que hay que localizar primero,
 *   - `peor.txt` esta en un CSV desordenado a proposito, y el mayor no es ni el
 *     primero ni el ultimo, asi que ordenar por el numero es el unico camino
 *     corto.
 *
 * Las tres respuestas son deterministas: el arbol se siembra igual para todos.
 */

/** 30 + 45 = 75 lineas de bitacora, que es la respuesta de `total.txt`. */
const SETUP = {
  dirs: ["proyecto/api", "proyecto/web", "proyecto/datos", "metricas"],
  files: [
    { path: "proyecto/api/config.conf", content: "puerto = 8080\ntiempo_espera = 2\n" },
    { path: "proyecto/api/app.log", lines: 30, fill: "INFO peticion atendida" },
    { path: "proyecto/web/config.conf", content: "raiz = /var/www\n" },
    { path: "proyecto/web/nginx.conf", content: "worker_processes = 4\n" },
    { path: "proyecto/web/acceso.log", lines: 45, fill: "GET /inicio 200" },
    { path: "proyecto/datos/respaldo.csv", content: "tabla,filas\nusuarios,1420\npedidos,8830\n" },
    { path: "proyecto/leeme.txt", content: "Copia de trabajo del proyecto.\n" },
    {
      path: "metricas/errores.csv",
      content:
        "servicio,errores\npagos,12\nsesiones,3\ncatalogo,25\ninformes,7\nnotificaciones,18\n",
    },
  ],
}

const CONFIGS = [
  "proyecto/api/config.conf",
  "proyecto/web/config.conf",
  "proyecto/web/nginx.conf",
].join("\n")

const CHECKS = [
  {
    type: "archivo_contiene",
    params: { ruta: `${RAIZ}/configs.txt`, patron: "proyecto/web/nginx.conf" },
    points: 20,
    position: 0,
  },
  {
    type: "minimo_lineas",
    params: { ruta: `${RAIZ}/configs.txt`, cantidad: 3 },
    points: 20,
    position: 1,
  },
  { type: "archivo_es", params: { ruta: `${RAIZ}/total.txt`, valor: "75" }, points: 30, position: 2 },
  { type: "archivo_es", params: { ruta: `${RAIZ}/peor.txt`, valor: "catalogo" }, points: 30, position: 3 },
]

const DATOS = {
  title: "El árbol del proyecto",
  kind: "activity",
  difficulty: "intermediate",
  instructions:
    "Tres preguntas sobre el mismo árbol: qué configuraciones hay, cuánto " +
    "ocupan las bitácoras y qué servicio falla más. Una herramienta para cada una.",
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
  console.log(`  configs esperados:\n${CONFIGS.split("\n").map((c) => "    " + c).join("\n")}`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
