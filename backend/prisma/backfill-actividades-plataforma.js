const prisma = require("./client")
const groupActivityService = require("../src/services/groupActivityService")

/**
 * Publica las actividades del curso en los grupos que ya existian.
 *
 * Desde ahora un grupo nuevo las recibe al crearse, pero los que estaban antes
 * de este cambio no tienen ninguna publicada, y sin publicacion sus notas no
 * llegan al libro de calificaciones. Esto los pone al dia.
 *
 * Es idempotente porque `publishBankActivities` se salta lo ya publicado, asi
 * que se puede correr las veces que haga falta: despues de sembrar actividades
 * nuevas, por ejemplo, para que lleguen a los grupos vivos.
 *
 *     node prisma/backfill-actividades-plataforma.js
 */
async function main() {
  const grupos = await prisma.group.findMany({
    where: { archived: false },
    select: { id: true, name: true },
    orderBy: { created_at: "asc" },
  })

  if (grupos.length === 0) {
    console.log("No hay grupos activos.")
    return
  }

  let total = 0
  for (const grupo of grupos) {
    const creadas = await groupActivityService.publishBankActivities(grupo.id)
    total += creadas
    console.log(
      `${grupo.name}: ${creadas === 0 ? "ya estaba al dia" : `${creadas} actividades publicadas`}`,
    )
  }
  console.log(`\n${total} publicaciones nuevas en ${grupos.length} grupos.`)

  const enganchados = await engancharIntentosSueltos()
  console.log(`${enganchados} intentos anteriores enganchados a su publicacion.`)
}

/**
 * Cuelga de su publicacion los intentos que se hicieron antes de este cambio.
 *
 * Sin esto, quien ya hubiera resuelto una actividad del curso saldria como "sin
 * iniciar" en el libro de calificaciones hasta volver a pulsar el boton: el
 * trabajo estaba hecho pero el intento no colgaba de ninguna publicacion. Se
 * respeta el intento tal cual (nota, fecha y resultados); lo unico que se
 * rellena es a que publicacion pertenece.
 */
async function engancharIntentosSueltos() {
  const sueltos = await prisma.activityAttempt.findMany({
    where: {
      group_activity_id: null,
      definition: { source: "bank", kind: "activity" },
    },
    select: { id: true, student_id: true, activity_definition_id: true },
  })
  if (sueltos.length === 0) return 0

  // El grupo de cada estudiante, resuelto una sola vez.
  const matriculas = await prisma.enrollment.findMany({
    where: {
      student_id: { in: [...new Set(sueltos.map((a) => a.student_id))] },
      status: "active",
      group: { archived: false },
    },
    select: { student_id: true, group_id: true },
    orderBy: { enrolled_at: "asc" },
  })
  const grupoDe = new Map()
  for (const m of matriculas) {
    if (!grupoDe.has(m.student_id)) grupoDe.set(m.student_id, m.group_id)
  }

  const publicaciones = await prisma.groupActivity.findMany({
    where: { group_id: { in: [...new Set(grupoDe.values())] } },
    select: { id: true, group_id: true, activity_definition_id: true },
  })
  const publicacionDe = new Map(
    publicaciones.map((p) => [`${p.group_id}:${p.activity_definition_id}`, p.id]),
  )

  let enganchados = 0
  for (const intento of sueltos) {
    const grupoId = grupoDe.get(intento.student_id)
    if (!grupoId) continue
    const publicacionId = publicacionDe.get(`${grupoId}:${intento.activity_definition_id}`)
    if (!publicacionId) continue
    await prisma.activityAttempt.update({
      where: { id: intento.id },
      data: { group_activity_id: publicacionId },
    })
    enganchados++
  }
  return enganchados
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
