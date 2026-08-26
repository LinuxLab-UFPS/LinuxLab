import { getTopic } from "@shared/lib/content/temario"
import { scoreFillColor } from "@shared/lib/score-color"
import type { ExcelCell, ExcelMerge, ExcelSheetSpec } from "@shared/lib/excel"
import type { Gradebook, GradebookActivity, GradebookCell } from "@/lib/models/groups"

const HEADER_FILL = "F1F5F9"
const OVERDUE_FILL = "FEE2E2"
const REVIEW_FILL = "FEF3C7"
const NOT_STARTED_FILL = "F1F5F9"
const DISABLED_MUTED = "94A3B8"

/** El nombre del tema desde el temario; sin entrada cae a "Sin tema". */
function topicTitleOf(topicNumber: number | null): string {
  if (topicNumber === null || topicNumber === 0) return "Sin tema"
  return getTopic(topicNumber)?.title ?? `Tema ${topicNumber}`
}

/** Una casilla del cuaderno: nota numérica con color, o estado como texto. */
function cellFrom(cell: GradebookCell | undefined): ExcelCell {
  if (!cell || cell.status === "not-started") {
    return { value: null, align: "center", fill: NOT_STARTED_FILL }
  }
  if (cell.status === "completed") {
    if (cell.score === null) return { value: null, align: "center" }
    return { value: cell.score, align: "center", fill: scoreFillColor(cell.score) }
  }
  if (cell.status === "overdue") {
    return { value: 0, align: "center", fill: OVERDUE_FILL }
  }
  // under-review: entrega manual sin calificar.
  return { value: "Revisión", align: "center", fill: REVIEW_FILL }
}

/**
 * Convierte el cuaderno de calificaciones en una hoja de cálculo con la misma
 * estructura visible en la UI: temas agrupados sobre las actividades, una
 * columna "Definitiva" y la fila de promedios por actividad al final.
 */
export function buildGradebookSheet(gradebook: Gradebook): ExcelSheetSpec {
  const { students, activities, cells, activityAverages, studentAverages, topicActivities } =
    gradebook

  // Columnas agrupadas por tema: cada tema aparece una sola vez con sus
  // actividades contiguas, ordenadas según el temario ("Sin tema" al final).
  const grouped = new Map<number, GradebookActivity[]>()
  for (const a of activities) {
    const t = a.topicNumber ?? 0
    if (!grouped.has(t)) grouped.set(t, [])
    grouped.get(t)!.push(a)
  }
  const groups = [...grouped.entries()]
    .sort(([a], [b]) => (a === 0 ? 1 : b === 0 ? -1 : a - b))
    .map(([topicNumber, list]) => ({
      topicNumber: topicNumber === 0 ? null : topicNumber,
      activities: list,
    }))
  const orderedActivities = groups.flatMap((g) => g.activities)

  // Código, Nombre, actividades, Curso, Definitiva
  const colCount = orderedActivities.length + 4
  const merges: ExcelMerge[] = []

  const header: ExcelCell[] = [
    { value: "Código", bold: true, align: "center", fill: HEADER_FILL },
    { value: "Nombre", bold: true, align: "center", fill: HEADER_FILL },
  ]
  let col = 2
  for (const group of groups) {
    if (group.activities.length > 1) {
      merges.push({ from: { row: 0, col }, to: { row: 0, col: col + group.activities.length - 1 } })
    }
    header.push({ value: topicTitleOf(group.topicNumber), bold: true, align: "center", fill: HEADER_FILL })
    // Ocupa las posiciones de las actividades restantes del tema para que el
    // header tenga el mismo nº de columnas que el resto de la cuadrícula.
    for (let i = 1; i < group.activities.length; i++) {
      header.push({ value: null, fill: HEADER_FILL })
    }
    col += group.activities.length
  }
  // Las del temario van como recuento, igual que en pantalla.
  header.push({ value: "Curso", bold: true, align: "center", fill: HEADER_FILL })
  header.push({ value: "Definitiva", bold: true, align: "center", fill: HEADER_FILL })

  merges.push({ from: { row: 0, col: 0 }, to: { row: 1, col: 0 } })
  merges.push({ from: { row: 0, col: 1 }, to: { row: 1, col: 1 } })
  merges.push({ from: { row: 0, col: colCount - 2 }, to: { row: 1, col: colCount - 2 } })
  merges.push({ from: { row: 0, col: colCount - 1 }, to: { row: 1, col: colCount - 1 } })

  const workdirRow: ExcelCell[] = [
    { value: null },
    { value: null },
    ...orderedActivities.map(
      (a) =>
        ({
          value: a.workdir,
          align: "center",
          fill: HEADER_FILL,
          fontColor: a.enabled ? undefined : DISABLED_MUTED,
        }) as ExcelCell,
    ),
    { value: null },
    { value: null },
  ]

  const body = students.map((student) => {
    const studentCells = cells[student.id] ?? {}
    const row: ExcelCell[] = [
      { value: student.code ?? null, align: "center" },
      { value: student.name, align: "left" },
      ...orderedActivities.map((a) => cellFrom(studentCells[a.id])),
    ]
    row.push({
      value: `${topicActivities.done[student.id] ?? 0}/${topicActivities.total}`,
      align: "center",
    })
    const avg = studentAverages[student.id]
    row.push(
      avg != null
        ? { value: avg, align: "center", bold: true, fill: scoreFillColor(avg) }
        : { value: null, align: "center" },
    )
    return row
  })

  // Promedio general del curso: media de los promedios por actividad.
  const activityAvgs = Object.values(activityAverages).filter((v): v is number => v !== null)
  const overallAverage =
    activityAvgs.length > 0
      ? Math.round((activityAvgs.reduce((a, b) => a + b, 0) / activityAvgs.length) * 10) / 10
      : null

  const footer: ExcelCell[] = [
    { value: null, fill: HEADER_FILL },
    { value: "Promedio por actividad", bold: true, align: "left", fill: HEADER_FILL },
    ...orderedActivities.map((a): ExcelCell => {
      const v = activityAverages[a.id]
      return v != null
        ? { value: v, align: "center", fill: HEADER_FILL }
        : { value: null, align: "center", fill: HEADER_FILL }
    }),
    { value: null, align: "center", fill: HEADER_FILL },
    overallAverage != null
      ? { value: overallAverage, align: "center", bold: true, fill: HEADER_FILL }
      : ({ value: null, align: "center", fill: HEADER_FILL } as ExcelCell),
  ]

  return {
    name: "Calificaciones",
    grid: [header, workdirRow, ...body, footer],
    merges,
    freeze: { xSplit: 2, ySplit: 2 },
    columnWidths: [14, 32, ...orderedActivities.map(() => 12), 12, 12],
  }
}