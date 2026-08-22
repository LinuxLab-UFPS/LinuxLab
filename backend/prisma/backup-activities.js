/**
 * Copia de seguridad de las actividades y del trabajo de los estudiantes.
 *
 *   node prisma/respaldo-actividades.js guardar
 *   node prisma/respaldo-actividades.js restaurar prisma/respaldo/actividades-2026-08-11.json
 *
 * Se guardan cuatro cosas, y no todas valen lo mismo. Las definiciones y sus
 * aserciones se pueden rehacer desde las semillas `seed-*.js`. Las
 * publicaciones en grupo, los intentos y las entregas no: son configuracion del
 * docente y trabajo real de los estudiantes, y la clave foranea los borra en
 * cascada al borrar la definicion de la que cuelgan.
 *
 * Al restaurar se conservan los identificadores originales, de modo que cada
 * pieza vuelve a colgar de la suya. Lo que ya exista no se toca, y lo que
 * dependa de un grupo o de un usuario que no esten en la base se salta con
 * aviso en vez de reventar a mitad.
 */

const fs = require("fs")
const path = require("path")
const prisma = require("./client")

const CARPETA = path.join(__dirname, "respaldo")

async function guardar() {
  const definiciones = await prisma.activityDefinition.findMany({
    include: { checks: { orderBy: { position: "asc" } } },
    orderBy: { slug: "asc" },
  })
  const publicaciones = await prisma.groupActivity.findMany()
  const intentos = await prisma.activityAttempt.findMany()
  const entregas = await prisma.activitySubmission.findMany()

  fs.mkdirSync(CARPETA, { recursive: true })
  const destino = path.join(CARPETA, `actividades-${new Date().toISOString().slice(0, 10)}.json`)
  fs.writeFileSync(
    destino,
    JSON.stringify(
      { fecha: new Date().toISOString(), esquema: 2, definiciones, publicaciones, intentos, entregas },
      null,
      2,
    ),
  )

  const aserciones = definiciones.reduce((n, d) => n + d.checks.length, 0)
  console.log(`Guardado en ${destino}`)
  console.log(`  ${definiciones.length} definiciones · ${aserciones} aserciones`)
  console.log(`  ${publicaciones.length} publicaciones · ${intentos.length} intentos · ${entregas.length} entregas`)
  for (const d of definiciones) {
    console.log(`    ${(d.slug ?? "(sin slug)").padEnd(28)} ${d.checks.length} aserciones`)
  }
}

/** Crea la fila si no estaba ya, y avisa si le falta algo de lo que depende. */
async function reponer(modelo, fila, requisitos = []) {
  if (await modelo.findUnique({ where: { id: fila.id } })) return "existe"
  for (const [nombre, comprobar] of requisitos) {
    if (!(await comprobar())) return `falta ${nombre}`
  }
  await modelo.create({ data: fila })
  return "creada"
}

async function restaurar(archivo) {
  if (!archivo) throw new Error("Falta la ruta del archivo de respaldo")
  const copia = JSON.parse(fs.readFileSync(archivo, "utf8"))
  if (copia.esquema !== 2) {
    throw new Error(
      "Este respaldo es de un esquema anterior (actividades sin publicacion por grupo) y no se puede restaurar",
    )
  }

  const cuenta = {}
  const anota = (r) => { cuenta[r] = (cuenta[r] ?? 0) + 1 }

  // El orden importa: cada tanda depende de la anterior.
  for (const { checks, ...definicion } of copia.definiciones) {
    if (await prisma.activityDefinition.findUnique({ where: { id: definicion.id } })) { anota("definicion existe"); continue }
    await prisma.activityDefinition.create({
      data: { ...definicion, checks: { create: checks.map(({ activity_definition_id, ...c }) => c) } },
    })
    anota("definicion creada")
  }

  const hay = (modelo, id) => async () => Boolean(id) && Boolean(await modelo.findUnique({ where: { id } }))

  for (const p of copia.publicaciones) {
    anota("publicacion " + (await reponer(prisma.groupActivity, p, [["grupo", hay(prisma.group, p.group_id)]])))
  }
  for (const i of copia.intentos) {
    anota("intento " + (await reponer(prisma.activityAttempt, i, [["estudiante", hay(prisma.user, i.student_id)]])))
  }
  for (const e of copia.entregas) {
    anota("entrega " + (await reponer(prisma.activitySubmission, e, [["estudiante", hay(prisma.user, e.student_id)]])))
  }

  for (const [que, n] of Object.entries(cuenta).sort()) console.log(`  ${que}: ${n}`)
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
