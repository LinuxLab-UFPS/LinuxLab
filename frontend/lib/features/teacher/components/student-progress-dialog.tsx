"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@shared/components/ui/dialog"
import { ProgressBar } from "@shared/components/progress-indicators"
import { cn } from "@shared/lib/utils"
import { timeAgo } from "@/lib/utils/dates"
import type { ProgressStatus, StudentProgress } from "@/lib/features/teacher/types"
import type { Topic } from "@/lib/features/student/types"

interface StudentProgressDialogProps {
  student: StudentProgress | null
  topics: Topic[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_META: Record<ProgressStatus, { label: string; color: string; text: string }> = {
  completed: { label: "Completado", color: "var(--success)", text: "text-success" },
  "in-progress": { label: "En progreso", color: "var(--warning)", text: "text-warning" },
  "not-started": { label: "Sin iniciar", color: "var(--muted-foreground)", text: "text-muted-foreground" },
  overdue: { label: "Sin iniciar", color: "var(--muted-foreground)", text: "text-muted-foreground" },
}

function metaFor(status: ProgressStatus) {
  return STATUS_META[status] ?? STATUS_META["not-started"]
}

export function StudentProgressDialog({
  student,
  topics,
  open,
  onOpenChange,
}: StudentProgressDialogProps) {
  const topicProgressById = useMemo(
    () => new Map((student?.topicProgress ?? []).map((t) => [t.topicNumber, t])),
    [student],
  )

  if (!student) return null

  const { student: person, topicStatus, progress, lastActivity } = student
  const statuses = topics.map((t) => topicStatus[t.number] ?? "not-started")
  const completados = statuses.filter((s) => s === "completed").length
  const enProgreso = statuses.filter((s) => s === "in-progress").length
  const sinIniciar = statuses.filter((s) => s === "not-started").length

  const donutData = [
    { name: "Completado", value: completados, color: "var(--success)" },
    { name: "En progreso", value: enProgreso, color: "var(--warning)" },
    { name: "Sin iniciar", value: sinIniciar, color: "var(--muted-foreground)" },
  ].filter((d) => d.value > 0)

  const legend = [
    { label: "Completados", value: completados, text: "text-success", dot: "bg-success" },
    { label: "En progreso", value: enProgreso, text: "text-warning", dot: "bg-warning" },
    { label: "Sin iniciar", value: sinIniciar, text: "text-muted-foreground", dot: "bg-muted-foreground" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{person.name}</DialogTitle>
          <DialogDescription>
            Última actividad: {lastActivity ? timeAgo(lastActivity) : "Sin actividad"}
          </DialogDescription>
        </DialogHeader>

        {/* Dona + leyenda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="relative h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={80}
                  paddingAngle={2}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold font-mono text-foreground">{progress}%</span>
              <span className="text-xs text-muted-foreground">progreso total</span>
            </div>
          </div>

          <div className="space-y-2">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className={cn("w-2.5 h-2.5 rounded-full", item.dot)} />
                  {item.label}
                </span>
                <span className={cn("font-mono font-medium", item.text)}>{item.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-2 mt-2 border-t border-border">
              <span className="text-muted-foreground">Total de temas</span>
              <span className="font-mono font-medium text-foreground">{topics.length}</span>
            </div>
          </div>
        </div>

        {/* Desglose por tema con barra de progreso */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Desglose por tema
          </h4>
          <div className="space-y-2">
            {topics.map((topic) => {
              const status = topicStatus[topic.number] ?? "not-started"
              const meta = metaFor(status)
              const detail = topicProgressById.get(topic.number)
              const done = detail?.completed ?? 0
              const total = detail?.total ?? 0
              const percent = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <div
                  key={topic.number}
                  className="bg-secondary/30 border border-border rounded-md px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-sm text-foreground truncate">
                      {topic.number}. {topic.title}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium shrink-0",
                        meta.text,
                      )}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: meta.color }}
                      />
                      {meta.label}
                    </span>
                  </div>
                  <ProgressBar value={percent} />
                  <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                    {done}/{total} lecciones
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
