import { Fragment } from "react"
import { CheckCircle2, Clock } from "lucide-react"
import { cn } from "@shared/lib/utils"
import type { Grade } from "@/lib/models/groups"

/** Tabla de calificaciones de un estudiante, agrupada por tema. */
export function GradesTable({ grades }: { grades: Grade[] }) {
  let currentTopic = ""
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Calificaciones
      </h3>
      <div className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Actividad
                </th>
                <th className="w-[100px] px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tipo
                </th>
                <th className="w-[120px] px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Puntuación
                </th>
                <th className="w-[120px] px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => {
                const showHeader = grade.topicTitle !== currentTopic
                currentTopic = grade.topicTitle
                return (
                  <Fragment key={grade.id}>
                    {showHeader && (
                      <tr className="bg-secondary/30">
                        <td
                          colSpan={4}
                          className="px-4 py-2 text-xs font-medium text-muted-foreground"
                        >
                          {grade.topicTitle}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-border/50 transition-colors hover:bg-card/50">
                      <td className="px-4 py-2.5">
                        <span className="text-sm">{grade.activityName}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-xs",
                            grade.source === "bank"
                              ? "bg-primary/20 text-primary"
                              : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {grade.source === "bank" ? "Bank" : "Teacher"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {grade.score !== null ? (
                          <span className="font-mono text-sm">
                            <span
                              className={cn(
                                grade.score >= 80
                                  ? "text-success"
                                  : grade.score >= 50
                                    ? "text-warning"
                                    : "text-danger",
                              )}
                            >
                              {grade.score}
                            </span>
                            <span className="text-muted-foreground">/{grade.maxScore}</span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {grade.status === "completed" && (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="h-3 w-3" />
                            Completada
                          </span>
                        )}
                        {grade.status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-xs text-warning">
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </span>
                        )}
                        {grade.status === "not-started" && (
                          <span className="text-xs text-muted-foreground">Sin iniciar</span>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
