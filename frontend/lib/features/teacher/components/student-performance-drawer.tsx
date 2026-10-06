"use client"

import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@shared/components/ui/dialog"
import { cn } from "@shared/lib/utils"
import { getTopic } from "@shared/lib/content/temario"
import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"
import { GraficaTemas } from "@shared/components/charts/grade-charts"
import { scoreColor } from "@shared/lib/score-color"
import { useStudentPerformance } from "@/lib/api/queries"
import type { GradebookCellStatus, GradeSeriesPoint, GradeSummary } from "@/lib/models/groups"

/** El nombre del tema desde el temario; sin entrada cae a "Sin tema". */
function topicTitleOf(topicNumber: number): string {
  if (topicNumber === 0) return "Sin tema"
  return getTopic(topicNumber)?.title ?? `Tema ${topicNumber}`
}

interface StudentPerformanceDrawerProps {
  groupId: string
  studentId: string | null
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** KPI por estado, mapeando la clave de GradeSummary con el estado de casilla. */
const KPI_KEYS: { key: keyof GradeSummary; status: GradebookCellStatus }[] = [
  { key: "completed", status: "completed" },
  { key: "underReview", status: "under-review" },
  { key: "overdue", status: "overdue" },
  { key: "notStarted", status: "not-started" },
]

const STATUS_META: Record<
  GradebookCellStatus,
  { label: string; color: string; text: string }
> = {
  completed: { label: "Completadas", color: "var(--success)", text: "text-success" },
  "under-review": { label: "En revisión", color: "var(--warning)", text: "text-warning" },
  overdue: { label: "Vencidas", color: "var(--danger)", text: "text-danger" },
  "not-started": { label: "Sin iniciar", color: "var(--muted-foreground)", text: "text-muted-foreground" },
}

/** El estado de una sola actividad, en singular. */
const ROW_STATUS: Record<GradebookCellStatus, string> = {
  completed: "Completada",
  "under-review": "En revisión",
  overdue: "Vencida",
  "not-started": "Sin iniciar",
}

const STATUS_DOT: Record<GradebookCellStatus, string> = {
  completed: "bg-success",
  "under-review": "bg-warning",
  overdue: "bg-danger",
  "not-started": "bg-muted-foreground",
}

/** Título de tarjeta de sección dentro del modal. */
function ChartHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h4>
  )
}

function tooltipValue(value: number | string, _name: string) {
  return value == null ? "—" : `${value}`
}

export function StudentPerformanceDrawer({
  groupId,
  studentId,
  studentName,
  open,
  onOpenChange,
}: StudentPerformanceDrawerProps) {
  const query = useStudentPerformance(groupId, studentId ?? "")

  const loading = query.isLoading || !query.data
  const data = query.data

  const donutData =
    data?.series.length
      ? [
          { name: "Completadas", key: "completed" as const, value: data.summary.completed },
          { name: "En revisión", key: "under-review" as const, value: data.summary.underReview },
          { name: "Vencidas", key: "overdue" as const, value: data.summary.overdue },
          { name: "Sin iniciar", key: "not-started" as const, value: data.summary.notStarted },
        ].filter((d) => d.value > 0)
      : []

  const radarData =
    data?.topics.map((t) => ({
      topic: topicTitleOf(t.topicNumber),
      promedio: t.avgScore ?? 0,
      fullMark: 100,
    })) ?? []

  // Las del docente primero, igual que en la tabla de actividades del curso.
  const teacherRows = data?.series.filter((s) => s.source === "teacher") ?? []
  const bankRows = data?.series.filter((s) => s.source === "bank") ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] grid-cols-[minmax(0,1fr)] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{studentName}</DialogTitle>
          <DialogDescription>
            Rendimiento en el curso
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <SkeletonScreen className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
            <Skeleton className="h-40 w-full" />
          </SkeletonScreen>
        )}

        {!loading && data && (
          <div className="space-y-4">
            {/* KPIs compactos */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {KPI_KEYS.map((item) => (
                <div
                  key={item.key}
                  className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-center"
                >
                  <p className={cn("font-mono text-xl font-semibold", STATUS_META[item.status].text)}>
                    {data.summary[item.key]}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {STATUS_META[item.status].label}
                  </p>
                </div>
              ))}
            </div>

            {/* Dona y temas lado a lado */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0 rounded-lg border border-border bg-card p-4">
                <ChartHeader>Estados de actividades</ChartHeader>
                <div className="relative mx-auto h-44 max-w-[16rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={74}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        {donutData.map((d) => (
                          <Cell key={d.key} fill={STATUS_META[d.key].color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipValue} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-2xl font-bold text-foreground">
                      {data.summary.average ?? "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">Definitiva</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {donutData.length > 0 ? (
                    donutData.map((d) => (
                      <span key={d.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[d.key])} />
                        {STATUS_META[d.key].label}
                        <span className={cn("font-mono font-medium", STATUS_META[d.key].text)}>
                          {d.value}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin actividades aún.</span>
                  )}
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-border bg-card p-4">
                <ChartHeader>Rendimiento por tema</ChartHeader>
                {radarData.length > 0 ? (
                  <GraficaTemas datos={radarData} className="h-56" />
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Sin datos por tema.
                  </p>
                )}
              </div>
            </div>

            {/* Una lista y no una grafica: con muchas actividades la grafica
                pedia scroll lateral y no dejaba leer de cual era cada punto. */}
            <ActivityList title="Tus actividades" rows={teacherRows} />
            <ActivityList title="Actividades del temario" rows={bankRows} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Las actividades de un origen, una por fila: nota, intentos y estado. */
function ActivityList({ title, rows }: { title: string; rows: GradeSeriesPoint[] }) {
  if (rows.length === 0) return null
  return (
    <div className="space-y-2">
      <ChartHeader>{title}</ChartHeader>
      <ul className="divide-y divide-table-line rounded-lg border border-border">
        {rows.map((row) => (
          <li key={row.activityId} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                Tema {row.topicNumber || "—"} · {row.attempts}{" "}
                {row.attempts === 1 ? "intento" : "intentos"}
              </p>
            </div>
            <span className={cn("shrink-0 text-xs", STATUS_META[row.status].text)}>
              {ROW_STATUS[row.status]}
            </span>
            <span
              className={cn(
                "w-16 shrink-0 text-right font-mono text-sm",
                row.score != null ? scoreColor(row.score) : "text-muted-foreground",
              )}
            >
              {row.score != null ? `${row.score}/100` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
