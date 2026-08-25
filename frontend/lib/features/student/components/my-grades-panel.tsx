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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { CheckCircle2, Clock3, Users, TrendingUp, CalendarX } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { getTopic } from "@shared/lib/content/temario"
import { MetricCard } from "@shared/components/metric-card"
import { DIFFICULTY_LABEL } from "@shared/lib/content/activities"
import type { GradebookCellStatus, MyGrades } from "@/lib/models/groups"

/** El nombre del tema desde el temario; sin entrada cae a "Sin tema". */
function topicTitleOf(topicNumber: number): string {
  if (topicNumber === 0) return "Sin tema"
  return getTopic(topicNumber)?.title ?? `Tema ${topicNumber}`
}

const STATUS_META: Record<GradebookCellStatus, { label: string; text: string; dot: string }> = {
  completed: { label: "Completada", text: "text-success", dot: "bg-success" },
  "under-review": { label: "En revisión", text: "text-warning", dot: "bg-warning" },
  overdue: { label: "Vencida", text: "text-danger", dot: "bg-danger" },
  "not-started": { label: "Sin iniciar", text: "text-muted-foreground", dot: "bg-muted-foreground" },
}

function tooltipValue(value: number | string) {
  return value == null ? "—" : `${value}`
}

export function MyGradesPanel({ grades }: { grades: MyGrades }) {
  if (!grades.group) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mb-1 text-base font-medium text-foreground">Sin grupo activo</h2>
        <p className="text-sm text-muted-foreground">
          No estás inscrito en ningún grupo para ver calificaciones.
        </p>
      </div>
    )
  }

  const { series, topics, summary } = grades

  const lineData = series.map((s) => ({
    name: s.workdir,
    estudiante: s.score,
    grupo: s.groupAverage,
  }))

  const radarData = topics.map((t) => ({
    topic: topicTitleOf(t.topicNumber),
    promedio: t.avgScore ?? 0,
    fullMark: 100,
  }))

  const pending = summary.underReview

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Curso: <span className="font-medium text-foreground">{grades.group.name}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Promedio general"
          value={summary.average != null ? `${summary.average}/100` : "—"}
          icon={TrendingUp}
        />
        <MetricCard title="Completadas" value={summary.completed} icon={CheckCircle2} />
        <MetricCard title="En revisión" value={pending} icon={Clock3} />
        <MetricCard title="Vencidas" value={summary.overdue} icon={CalendarX} />
      </div>

      {/* Línea: mis notas vs promedio del grupo */}
      <div className="border border-border bg-card p-5">
        <h3 className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Calificación por actividad
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Tus notas frente al promedio del curso.
        </p>
        {lineData.length > 0 ? (
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
                  dataKey="estudiante"
                  name="Mi calificación"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="grupo"
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
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aún no hay actividades en tu curso.
          </p>
        )}
      </div>

      {/* Radar por tema + tabla de calificaciones */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Rendimiento por tema
          </h3>
          {radarData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
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
            <p className="py-12 text-center text-sm text-muted-foreground">Sin datos por tema.</p>
          )}
        </div>

        {/* Tabla vertical de calificaciones por actividad */}
        <div className="overflow-hidden border border-border bg-card lg:col-span-3">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Mis calificaciones
            </h3>
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Actividad
                  </th>
                  <th className="w-28 px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Estado
                  </th>
                  <th className="w-24 px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody>
                {series.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Sin actividades aún.
                    </td>
                  </tr>
                )}
                {series.map((s) => {
                  const meta = STATUS_META[s.status]
                  return (
                    <tr
                      key={s.activityId}
                      className="border-b border-border/50 transition-colors hover:bg-foreground/[0.04]"
                    >
                      <td className="px-5 py-2.5 text-left">
                        <span className="block text-sm font-medium">{s.title}</span>
                        {/* Las del curso se clasifican por dificultad y las del
                            docente por quiz o taller; nunca por las dos. */}
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                          #{s.activityNumber} ·{" "}
                          {s.source === "bank"
                            ? (s.difficulty ? DIFFICULTY_LABEL[s.difficulty] : "Curso")
                            : s.activityType === "quiz"
                              ? "Quiz"
                              : "Taller"}{" "}
                          · {s.evaluationType === "manual" ? "Revisión docente" : "Auto-evaluada"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium",
                            meta.text,
                          )}
                        >
                          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {s.score !== null ? (
                          <span
                            className={cn(
                              "font-mono text-sm font-medium",
                              s.score >= 80
                                ? "text-success"
                                : s.score >= 60
                                  ? "text-warning"
                                  : "text-danger",
                            )}
                          >
                            {s.score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
