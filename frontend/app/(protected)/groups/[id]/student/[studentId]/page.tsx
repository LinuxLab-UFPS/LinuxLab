import Link from "next/link"
import { ChevronLeft, User, Calendar, Clock, AlertCircle } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { CircularProgress } from "@shared/components/progress-indicators"
import { cn } from "@shared/lib/utils"
import { getStudentGroupDetail } from "@/lib/features/teacher/data"
import { requireServerRole } from "@/lib/features/auth/session"
import { GradesTable } from "@/lib/features/teacher/components/grades-table"

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>
}) {
  await requireServerRole(["teacher", "admin"])
  const { id, studentId } = await params
  const detail = await getStudentGroupDetail(id, studentId)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/groups/${id}/tracking`}>
              <Button variant="ghost" size="icon" className="shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <nav className="text-xs text-muted-foreground mb-1">
                <Link href="/home" className="hover:text-foreground">
                  Mis Grupos
                </Link>
                <span className="mx-2">/</span>
                <Link href={`/groups/${id}/tracking`} className="hover:text-foreground">
                  Seguimiento
                </Link>
                <span className="mx-2">/</span>
                <span className="text-foreground">{detail?.student.name ?? "Estudiante"}</span>
              </nav>
              <h1 className="text-xl font-semibold">Progreso del Estudiante</h1>
            </div>
          </div>
        </div>
      </div>

      {!detail ? (
        <div className="max-w-md mx-auto text-center py-24">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-secondary/60 flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-medium text-foreground mb-1">Sin datos</h2>
          <p className="text-sm text-muted-foreground mb-6">
            No hay información de progreso para este estudiante.
          </p>
          <Link href={`/groups/${id}/tracking`}>
            <Button variant="outline">Volver al seguimiento</Button>
          </Link>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Student Header Card */}
          <div className="bg-card border border-border p-6">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-secondary flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold mb-1">{detail.student.name}</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span className="font-mono">{detail.student.code}</span>
                  <span>{detail.student.email}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Inscrito: {new Date(detail.enrolledAt).toLocaleDateString("es-CO")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Última actividad: {detail.lastActive}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xs bg-secondary px-2 py-0.5">{detail.groupName}</span>
                </div>
              </div>

              <div className="shrink-0 text-center">
                <CircularProgress value={detail.overallProgress} size="lg" />
                <p className="text-xs text-muted-foreground mt-2">Progreso General</p>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Topic Progress */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Progreso por Tema
              </h3>
              <div className="space-y-3">
                {detail.topicProgress.map((topic) => {
                  const percent =
                    topic.total > 0 ? Math.round((topic.completed / topic.total) * 100) : 0
                  return (
                    <div
                      key={topic.topicNumber}
                      className="bg-card border border-border p-4 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {topic.topicNumber}. {topic.title}
                        </span>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-mono">
                            {topic.completed}/{topic.total} actividades
                          </span>
                          {topic.avgScore > 0 && (
                            <span className="font-mono">
                              Promedio: <span className="text-primary">{topic.avgScore}</span>/100
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-secondary/50 overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            percent === 100 ? "bg-success" : "bg-primary"
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: Recent Activities */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Actividades Recientes
              </h3>
              <div className="space-y-2">
                {detail.recentGrades.map((grade) => (
                  <div
                    key={grade.id}
                    className="bg-card border border-border p-3 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{grade.activityName}</p>
                        {grade.date && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {new Date(grade.date).toLocaleDateString("es-CO", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {grade.status === "completed" && grade.score !== null ? (
                          <span className="text-sm font-mono font-medium">
                            <span
                              className={cn(
                                grade.score >= 80
                                  ? "text-success"
                                  : grade.score >= 50
                                    ? "text-warning"
                                    : "text-danger"
                              )}
                            >
                              {grade.score}
                            </span>
                            <span className="text-muted-foreground">/{grade.maxScore}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-warning/20 text-warning px-2 py-0.5">
                            <AlertCircle className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                    {grade.evaluation && (
                      <div className="mt-2">
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5",
                            grade.evaluation === "auto"
                              ? "bg-primary/20 text-primary"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          {grade.evaluation === "auto" ? "Auto-evaluada" : "Revisión docente"}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <GradesTable grades={detail.grades} />

          {/* Summary */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <span>
              Total: {detail.grades.filter((g) => g.status === "completed").length} completadas de{" "}
              {detail.grades.length} actividades
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
