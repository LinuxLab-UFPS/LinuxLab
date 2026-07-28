"use client"

import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { ProgressStatus, StudentProgress } from "@/lib/features/teacher/types"
import type { Topic } from "@/lib/features/student/types"

interface StudentProgressDialogProps {
  student: StudentProgress | null
  topics: Topic[]
  groupId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusMeta: Record<ProgressStatus, { label: string; color: string; text: string }> = {
  completed: { label: "Completado", color: "var(--success)", text: "text-success" },
  "in-progress": { label: "En progreso", color: "var(--warning)", text: "text-warning" },
  "not-started": { label: "Sin iniciar", color: "var(--muted-foreground)", text: "text-muted-foreground" },
  overdue: { label: "Vencido", color: "var(--danger)", text: "text-danger" },
}

export function StudentProgressDialog({
  student,
  topics,
  groupId = "",
  open,
  onOpenChange,
}: StudentProgressDialogProps) {
  if (!student) return null

  const { student: person, topicStatus, progress, lastActivity } = student
  const statuses = topics.map((t) => topicStatus[t.number] ?? "not-started")
  const completados = statuses.filter((s) => s === "completed").length
  const enProgreso = statuses.filter((s) => s === "in-progress").length
  const sinIniciar = statuses.filter((s) => s === "not-started").length
  const vencidos = statuses.filter((s) => s === "overdue").length

  const donutData = [
    { name: "Completado", value: completados, color: "var(--success)" },
    { name: "En progreso", value: enProgreso, color: "var(--warning)" },
    { name: "Sin iniciar", value: sinIniciar, color: "var(--muted-foreground)" },
    { name: "Vencido", value: vencidos, color: "var(--danger)" },
  ].filter((d) => d.value > 0)

  const legend = [
    { label: "Completados", value: completados, text: "text-success", dot: "bg-success" },
    { label: "En progreso", value: enProgreso, text: "text-warning", dot: "bg-warning" },
    { label: "Sin iniciar", value: sinIniciar, text: "text-muted-foreground", dot: "bg-muted-foreground" },
    { label: "Vencidos", value: vencidos, text: "text-danger", dot: "bg-danger" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{person.name}</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{person.code}</span> · Última actividad: {lastActivity}
          </DialogDescription>
        </DialogHeader>

        {/* Chart + legend */}
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
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold font-mono text-foreground">{progress}%</span>
              <span className="text-xs text-muted-foreground">progreso</span>
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

        {/* Per-topic breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Desglose por tema
          </h4>
          <div className="space-y-1.5">
            {topics.map((topic) => {
              const status = topicStatus[topic.number] ?? "not-started"
              const meta = statusMeta[status]
              return (
                <div
                  key={topic.number}
                  className="flex items-center justify-between bg-secondary/30 border border-border rounded-md px-3 py-2"
                >
                  <span className="text-sm text-foreground">{topic.title}</span>
                  <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", meta.text)}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer link */}
        <div className="flex justify-end pt-1">
          <Link
            href={`/groups/${groupId}/student/${person.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Ver dashboard completo
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
