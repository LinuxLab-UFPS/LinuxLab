"use client"

import Link from "next/link"
import { cn } from "@shared/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip"
import { getTopic } from "@shared/lib/content/temario"
import type {
  Gradebook,
  GradebookActivity,
  GradebookCell,
} from "@/lib/models/groups"

/** Color de la nota según la escala del curso: rojo < 60, ámbar >= 60, verde >= 80. */
function scoreColor(score: number) {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-warning"
  return "text-danger"
}

/** El nombre del tema desde el temario; sin entrada cae a "Sin tema". */
function topicTitleOf(topicNumber: number | null): string {
  if (topicNumber === null || topicNumber === 0) return "Sin tema"
  return getTopic(topicNumber)?.title ?? `Tema ${topicNumber}`
}

/** Una casilla del cuaderno: nota coloreada o badge de estado. */
function CellContent({ cell }: { cell: GradebookCell | undefined }) {
  if (!cell) return <span className="text-muted-foreground">—</span>

  if (cell.status === "completed") {
    return cell.score === null ? (
      <span className="text-muted-foreground">—</span>
    ) : (
      <span
        title={`${cell.attempts} intento${cell.attempts === 1 ? "" : "s"}`}
        className={cn("font-mono text-sm font-medium", scoreColor(cell.score))}
      >
        {cell.score}/100
      </span>
    )
  }

  // Vencida sin entregar: cuenta como 0 en el promedio.
  if (cell.status === "overdue") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="rounded bg-danger/15 px-1.5 py-px text-[9px] font-semibold uppercase text-danger">
            Vencida
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          El estudiante no entregó la actividad antes de la fecha de cierre y se considera como 0 en el promedio
        </TooltipContent>
      </Tooltip>
    )
  }

  // En revisión: entrega manual sin calificar aún.
  if (cell.status === "under-review") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
      <span className="rounded bg-warning/15 px-1.5 py-px text-[9px] font-semibold uppercase text-warning">
            Revisión
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          Actividad pendiente por revisión del docente
        </TooltipContent>
      </Tooltip>
    )
  }

  // Sin iniciar: aún sin intentos ni entrega.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="rounded bg-muted-foreground/10 px-1.5 py-px text-[9px] font-semibold uppercase text-muted-foreground">
          Sin iniciar
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        El estudiante aun no ha iniciado la actividad
      </TooltipContent>
    </Tooltip>
  )
}

interface GradebookTableProps {
  gradebook: Gradebook
  /** Para enlazar cada columna de actividad a su detalle. */
  groupId: string
  /** Filas de la página actual (ya filtradas y recortadas por el panel). */
  students: { id: string; name: string; code: string | null }[]
  onStudentClick: (studentId: string, name: string) => void
}

export function GradebookTable({ gradebook, groupId, students, onStudentClick }: GradebookTableProps) {
  const { activities, cells, activityAverages, studentAverages } = gradebook

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
  // El orden real de las columnas: usado por el cuerpo y el pie para que las
  // celdas siempre coincidan con las cabeceras.
  const orderedActivities = groups.flatMap((g) => g.activities)

  const activityCount = activities.length

  // Promedio general del curso: media de los promedios por actividad.
  const activityAvgs = activityAverages
    ? Object.values(activityAverages).filter((v): v is number => v !== null)
    : []
  const overallAverage =
    activityAvgs.length > 0
      ? Math.round((activityAvgs.reduce((a, b) => a + b, 0) / activityAvgs.length) * 10) / 10
      : null

  return (
    <div className="overflow-hidden rounded-xl border border-table-line bg-background shadow-md dark:shadow-none">
      {activityCount > 0 && (
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            {/* Fila de temas: los temas agrupan las columnas de actividades. */}
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-20 w-24 min-w-24 max-w-24 border-b border-r border-table-line bg-table-surface px-3 py-3 text-center align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Código
              </th>
              <th
                rowSpan={2}
                className="sticky left-24 z-20 w-56 min-w-56 max-w-56 border-b border-r border-table-line bg-table-surface px-4 py-3 text-center align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Nombre
              </th>
              {groups.map((group) => (
                <th
                  key={group.topicNumber ?? "none"}
                  colSpan={group.activities.length}
                  className="border-b border-r border-table-line bg-table-surface px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  title={topicTitleOf(group.topicNumber)}
                >
                  {topicTitleOf(group.topicNumber)}
                </th>
              ))}
              <th
                rowSpan={2}
                className="sticky right-0 z-20 w-24 min-w-24 border-b border-l border-table-line bg-table-surface px-3 py-3 text-center align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Definitiva
              </th>
            </tr>
            {/* Fila de actividades: código del directorio (T-0001) que enlaza
                al detalle; el título completo vive en el tooltip. */}
            <tr>
              {groups.flatMap((group) =>
                group.activities.map((a) => (
                  <th
                    key={a.id}
                    className="w-24 min-w-24 max-w-24 border-b border-r border-table-line bg-table-surface p-0"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/groups/${groupId}/activities/${a.id}?from=calificaciones`}
                          className="block w-full px-1 py-2 text-center font-mono text-[11px] font-semibold text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                        >
                          {a.workdir}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-left">
                        <p className="font-medium normal-case">{a.title}</p>
                        <p className="mt-1 font-normal normal-case">
                          {a.activityType === "quiz" ? "Quiz" : "Taller"} ·{" "}
                          {a.evaluationType === "manual" ? "Revisión docente" : "Auto-evaluada"}
                          {a.dueAt
                            ? ` · Cierre: ${new Date(a.dueAt).toLocaleDateString("es-CO")}`
                            : ""}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                )),
              )}
            </tr>
          </thead>

          <tbody>
            {students.map((student) => {
              const studentCells = cells[student.id] ?? {}
              return (
                <tr key={student.id} className="border-b border-table-line">
                  <td className="sticky left-0 z-10 w-24 min-w-24 max-w-24 border-b border-r border-table-line bg-background px-3 py-2.5 text-center">
                    <span className="font-mono text-xs text-muted-foreground">
                      {student.code ?? "—"}
                    </span>
                  </td>
                  <td className="sticky left-24 z-10 w-56 min-w-56 max-w-56 border-b border-r border-table-line bg-background px-4 py-2.5 text-left">
                    <button
                      type="button"
                      onClick={() => onStudentClick(student.id, student.name)}
                      className="text-left"
                    >
                      <span className="block w-full truncate text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline">
                        {student.name}
                      </span>
                    </button>
                  </td>

                  {orderedActivities.map((a) => (
                    <td
                      key={a.id}
                      className={cn(
                        "border-b border-r border-table-line px-1 py-2.5 text-center",
                        !a.enabled && "opacity-40",
                      )}
                    >
                      <CellContent cell={studentCells[a.id]} />
                    </td>
                  ))}

                  <td className="sticky right-0 z-10 border-b border-l border-table-line bg-background px-3 py-2.5 text-center">
                    {studentAverages[student.id] != null ? (
                      <span className={cn("font-mono text-sm font-semibold", scoreColor(studentAverages[student.id]!))}>
                        {studentAverages[student.id]}/100
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Fila de promedios por actividad. */}
          <tfoot>
            <tr className="bg-table-surface">
              <td className="sticky left-0 z-10 w-24 min-w-24 max-w-24 border-t border-r border-table-line bg-table-surface px-3 py-2.5 text-center"></td>
              <td className="sticky left-24 z-10 w-56 min-w-56 max-w-56 border-t border-r border-table-line bg-table-surface px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Promedio por actividad
              </td>
              {orderedActivities.map((a) => (
                <td
                  key={a.id}
                  className="border-t border-r border-table-line px-1 py-2.5 text-center"
                >
                  {activityAverages[a.id] != null ? (
                    <span className="font-mono text-xs font-medium text-foreground">
                      {activityAverages[a.id]}/100
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              ))}
              <td className="sticky right-0 z-10 border-t border-l border-table-line bg-table-surface px-3 py-2.5 text-center">
                {overallAverage != null ? (
                  <span className="font-mono text-sm font-bold text-foreground">
                    {overallAverage}/100
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      )}

      {students.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          Ningún estudiante coincide con la búsqueda.
        </div>
      )}
    </div>
  )
}
