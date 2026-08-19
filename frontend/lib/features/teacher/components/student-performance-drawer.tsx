"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from "recharts"
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
import { useStudentPerformance } from "@/lib/api/queries"
import type { GradebookCellStatus, GradeSummary } from "@/lib/models/groups"

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

  const firstName = studentName.trim().split(/\s+/)[0] || "Estudiante"

  const loading = query.isLoading || !query.data
  const data = query.data

  const lineData =
    data?.series.map((s) => ({
      name: s.workdir,
      student: s.score,
      group: s.groupAverage,
    })) ?? []

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

  const barData =
    data?.series
      .filter((s) => s.attempts > 0)
      .map((s) => ({ name: s.workdir, intentos: s.attempts })) ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
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

            {/* Donut + Radar lado a lado */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
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

              <div className="rounded-lg border border-border bg-card p-4">
                <ChartHeader>Rendimiento por tema</ChartHeader>
                {radarData.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="72%">
                        <PolarGrid stroke="var(--table-line)" />
                        <PolarAngleAxis
                          dataKey="topic"
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        />
                        <PolarRadiusAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <Radar
                          name="Promedio por tema"
                          dataKey="promedio"
                          stroke="var(--primary)"
                          fill="var(--primary)"
                          fillOpacity={0.35}
                        />
                        <Tooltip formatter={tooltipValue} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Sin datos por tema.
                  </p>
                )}
              </div>
            </div>

            {/* Línea: score por actividad vs. promedio del grupo */}
            <div className="rounded-lg border border-border bg-card p-4">
              <ChartHeader>Calificación por actividad</ChartHeader>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 8, right: 16, bottom: 4, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--table-line)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      stroke="var(--muted-foreground)"
                      minTickGap={8}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip formatter={tooltipValue} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="student"
                      name={firstName}
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="group"
                      name="Promedio del grupo"
                      stroke="var(--muted-foreground)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Barras: intentos por actividad */}
            <div className="rounded-lg border border-border bg-card p-4">
              <ChartHeader>Intentos por actividad</ChartHeader>
              {barData.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 4, left: -24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--table-line)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        stroke="var(--muted-foreground)"
                        minTickGap={8}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <Tooltip formatter={tooltipValue} />
                      <Bar dataKey="intentos" name="Intentos" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sin intentos registrados.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
