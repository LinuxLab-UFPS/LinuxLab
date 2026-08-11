/**
 * Copia de seguridad de las actividades y sus intentos.
 *
 *   node prisma/respaldo-actividades.js guardar
 *   node prisma/respaldo-actividades.js restaurar prisma/respaldo/actividades-2026-08-11.json
 *
 * Las definiciones (actividad y aserciones) se pueden rehacer desde las semillas
 * `seed-*.js`, pero los intentos no: son el trabajo real de los estudiantes con
 * su nota, y la clave foránea los borra en cascada al borrar la actividad. Esta
 * copia existe para eso.
 *
 * Al restaurar se conservan los identificadores originales, de modo que un
 * intento vuelve a colgar de su actividad. Lo que ya exista no se toca.
 */

const fs = require("fs")
const path = require("path")
const prisma = require("./client")

const CARPETA = path.join(__dirname, "respaldo")

async function guardar() {
  const actividades = await prisma.activity.findMany({
    include: { checks: { orderBy: { position: "asc" } }, attempts: true },
    orderBy: { slug: "asc" },
  })

  fs.mkdirSync(CARPETA, { recursive: true })
  const fecha = new Date().toISOString().slice(0, 10)
  const destino = path.join(CARPETA, `actividades-${fecha}.json`)
  fs.writeFileSync(destino, JSON.stringify({ fecha: new Date().toISOString(), actividades }, null, 2))

  const checks = actividades.reduce((n, a) => n + a.checks.length, 0)
  const intentos = actividades.reduce((n, a) => n + a.attempts.length, 0)
  console.log(`Guardado en ${destino}`)
  console.log(`  ${actividades.length} actividades · ${checks} aserciones · ${intentos} intentos`)
  for (const a of actividades) {
    console.log(`    ${a.slug} [${a.kind}] ${a.checks.length} aserciones, ${a.attempts.length} intentos`)
  }
}

async function restaurar(archivo) {
  if (!archivo) throw new Error("Falta la ruta del archivo de respaldo")
  const { actividades } = JSON.parse(fs.readFileSync(archivo, "utf8"))

  let nuevas = 0, saltadas = 0, intentos = 0
  for (const a of actividades) {
    const { checks, attempts, ...datos } = a
    const existe = await prisma.activity.findUnique({ where: { id: datos.id } })
    if (existe) {
      saltadas++
    } else {
      await prisma.activity.create({
        data: { ...datos, checks: { create: checks.map(({ activity_id, ...c }) => c) } },
      })
      nuevas++
    }
    // Los intentos se reponen aparte: puede faltar sólo el historial aunque la
    // actividad siga en pie.
    for (const intento of attempts) {
      const yaEsta = await prisma.activityAttempt.findUnique({ where: { id: intento.id } })
      if (!yaEsta) {
        await prisma.activityAttempt.create({ data: intento })
        intentos++
      }
    }
  }
  console.log(`Restauradas ${nuevas} actividades (${saltadas} ya estaban) y ${intentos} intentos`)
}

const [accion, archivo] = process.argv.slice(2)
const tarea =
  accion === "guardar" ? guardar() :
  accion === "restaurar" ? restaurar(archivo) :
  Promise.reject(new Error("Uso: respaldo-actividades.js guardar | restaurar <archivo>"))

tarea
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
