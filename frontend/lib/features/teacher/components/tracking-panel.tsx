"use client"

import { useState } from "react"
import { Users, BarChart3, CheckCircle2, Search } from "lucide-react"
import { Input } from "@shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select"
import { MetricCard } from "@shared/components/metric-card"
import { StatusIndicator, ProgressBar } from "@shared/components/progress-indicators"
import { StudentProgressDialog } from "@/lib/features/teacher/components/student-progress-dialog"
import type { GroupProgressSummary, StudentProgress } from "@/lib/features/teacher/types"
import type { Topic } from "@/lib/features/student/types"

interface TrackingPanelProps {
  groupId: string
  summary: GroupProgressSummary
  /** Topics enabled for this group (subset of the temario). */
  topics: Topic[]
}

export function TrackingPanel({ groupId, summary, topics }: TrackingPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const openStudent = (student: StudentProgress) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const filteredStudents = summary.rows.filter((row) => {
    const matchesQuery =
      row.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.student.code.includes(searchQuery)
    if (!matchesQuery) return false
    // El filtro de tema revisa el estado de ese tema en la fila: si el tema no
    // esta habilitado para el estudiante (sin entrada), la fila no califica.
    if (selectedTopic === "all") return true
    const status = row.topicStatus[Number(selectedTopic)]
    return status !== undefined && status !== "not-started"
  })

  return (
    <div className="p-6 space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Estudiantes inscritos" value={summary.enrolledCount} icon={Users} />
        <MetricCard title="Promedio general" value={`${summary.averageProgress}%`} icon={BarChart3} />
        <MetricCard title="Completadas hoy" value={summary.completedToday} icon={CheckCircle2} />
        <MetricCard title="Activos ahora" value={summary.activeNow} icon={Users} isLive />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-auto min-w-[200px] bg-card">
            <SelectValue placeholder="Todos los temas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los temas</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.number} value={String(topic.number)}>
                {topic.number}. {topic.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar estudiante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
          <div className="flex items-center gap-1.5">
            <span>Completado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>En progreso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Sin iniciar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Vencido</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-[240px]">
                  Estudiante
                </th>
                {topics.map((topic) => (
                  <th
                    key={topic.number}
                    className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-[80px]"
                    title={topic.title}
                  >
                    T{topic.number}
                  </th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-[160px]">
                  Progreso
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-[140px]">
                  Última actividad
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((row) => (
                <tr
                  key={row.student.id}
                  className="border-b border-border/50 hover:bg-card/50 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <button onClick={() => openStudent(row)} className="group/link text-center">
                      <span className="text-sm font-medium text-foreground group-hover/link:text-primary group-hover/link:underline decoration-primary underline-offset-2 transition-colors">
                        {row.student.name}
                      </span>
                      <span className="block text-xs font-mono text-muted-foreground">
                        {row.student.code}
                      </span>
                    </button>
                  </td>
                  {topics.map((topic) => (
                    <td key={topic.number} className="px-3 py-3">
                      <StatusIndicator status={row.topicStatus[topic.number] ?? "not-started"} />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <ProgressBar value={row.progress} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-mono text-muted-foreground">
                      {row.lastActivity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No hay estudiantes inscritos en este curso.
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
        <span>
          Mostrando {filteredStudents.length} de {summary.rows.length} estudiantes
        </span>
      </div>

      {/* Student progress dialog */}
      <StudentProgressDialog
        student={selectedStudent}
        topics={topics}
        groupId={groupId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
