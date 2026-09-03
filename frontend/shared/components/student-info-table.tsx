"use client"

import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { scoreColor } from "@shared/lib/score-color"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import { formatBogotaDateTime } from "@/lib/utils/dates"

/** Resultado de una asercion tal como se muestra en la retroalimentación. */
export interface CheckFeedback {
  id: string
  passed: boolean
  points: number
  detail: string
}

/** Una fila de la tabla de intentos (actividades automáticas). */
export interface AttemptRow {
  attemptNumber: number
  passed: boolean
  score: number
  createdAt: string
}

/** Formulario de calificación (solo vista docente, entrega manual sin calificar). */
export interface GradeFormValue {
  scoreInput: string
  onScoreChange: (value: string) => void
  scoreError: boolean
  feedbackInput: string
  onFeedbackChange: (value: string) => void
}

interface StudentInfoTableProps {
  /** Identidad del estudiante; solo se muestra en la vista docente. */
  studentName?: string
  studentCode?: string | null
  /** Oculta las filas de nombre y código (vista del estudiante). */
  showIdentity?: boolean
  submittedAt: string | null | undefined
  /** Badge/Tag con el estado de la calificación. */
  statusNode: React.ReactNode
  /** Calificación numérica (sin máximo) para mostrar cuando no hay formulario. */
  score: number | null
  maxScore: number
  /** "manual" => retroalimentación en fila; "automatic" => bloque de dos columnas. */
  feedbackVariant: "manual" | "automatic"
  /** Texto libre de retroalimentación (modo manual). */
  feedbackNode?: React.ReactNode
  /** Resultados de cada aserción (modo automático). */
  checks?: CheckFeedback[]
  /** Presente solo cuando el docente puede calificar la entrega. */
  gradeForm?: GradeFormValue
}

/**
 * Tabla de información del estudiante que comparten el detalle de entrega del
 * docente y el panel de actividad del estudiante (curso y temario). El mismo
 * formato en los tres lugares: nombre, código, fecha, estado, calificación y
 * retroalimentación.
 *
 * La retroalimentación se muestra de dos formas según `feedbackVariant`:
 * - "manual": como una fila más de la tabla (texto libre del docente).
 * - "automatic": como un bloque de dos columnas bajo la tabla, con cada
 *   aserción a la izquierda y su resultado a la derecha. La calificación total
 *   siempre vive en la fila "Calificación" de la tabla.
 */
export function StudentInfoTable({
  studentName,
  studentCode,
  showIdentity = true,
  submittedAt,
  statusNode,
  score,
  maxScore,
  feedbackVariant,
  feedbackNode,
  checks,
  gradeForm,
}: StudentInfoTableProps) {
  const isAutomatic = feedbackVariant === "automatic" && !gradeForm
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <tbody>
          {showIdentity && (
            <>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2.5 font-medium text-foreground w-56">Nombre del estudiante</td>
                <td className="px-4 py-2.5 text-muted-foreground">{studentName}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2.5 font-medium text-foreground w-56">Código del estudiante</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{studentCode ?? "—"}</td>
              </tr>
            </>
          )}
          <tr className="border-b border-border/50">
            <td className="px-4 py-2.5 font-medium text-foreground w-56">Fecha de entrega</td>
            <td className="px-4 py-2.5 text-muted-foreground">
              {submittedAt ? formatBogotaDateTime(submittedAt) : "—"}
            </td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="px-4 py-2.5 font-medium text-foreground w-56">Estado</td>
            <td className="px-4 py-2.5">{statusNode}</td>
          </tr>
          <tr className={isAutomatic ? "" : "border-b border-border/50"}>
            <td className="px-4 py-2.5 font-medium text-foreground w-56">Calificación</td>
            <td className="px-4 py-2.5">
              {gradeForm ? (
                <div className="space-y-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={gradeForm.scoreInput}
                    onChange={(e) => gradeForm.onScoreChange(e.target.value)}
                    aria-invalid={gradeForm.scoreError || undefined}
                    className={cn(
                      "w-32 border-table-line font-mono",
                      gradeForm.scoreError && "border-danger focus:ring-danger",
                    )}
                  />
                  {gradeForm.scoreError && (
                    <p className="text-xs text-danger">Debe ser un entero entre 0 y 100.</p>
                  )}
                </div>
              ) : score != null ? (
                <span className={cn("font-mono text-sm font-medium", scoreColor(score))}>
                  {score}/{maxScore} pts.
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
          </tr>
          {!isAutomatic && (
            <tr>
              <td className="px-4 py-2.5 font-medium text-foreground w-56">Retroalimentación</td>
              <td className="px-4 py-2.5">
                {gradeForm ? (
                  <Textarea
                    value={gradeForm.feedbackInput}
                    onChange={(e) => gradeForm.onFeedbackChange(e.target.value)}
                    placeholder="Comentarios para el estudiante..."
                    className="h-28 resize-none overflow-y-auto border-table-line text-sm"
                  />
                ) : (
                  feedbackNode ?? <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isAutomatic && <AutomaticFeedbackColumns results={checks ?? []} />}
    </div>
  )
}

/**
 * Resultado de cada aserción de una actividad automática: a la izquierda la
 * descripción de la aserción (con todo el ancho disponible) y a la derecha su
 * puntaje. El texto lo construye el checker (backend), así que aquí solo se
 * muestra `detail` tal cual viene.
 */
function AutomaticFeedbackColumns({ results }: { results: CheckFeedback[] }) {
  return (
    <div className="border-t border-border">
      {/* La columna de resultado es fija y angosta: el detalle de la aserción
          es lo que se lee, así que se queda con todo el ancho restante. */}
      <div className="grid grid-cols-[1fr_9rem] border-b border-border/50">
        <div className="px-4 py-2.5 text-sm font-medium text-foreground">Aserciones</div>
        <div className="px-4 py-2.5 text-right text-sm font-medium text-foreground">Resultado</div>
      </div>
      {results.length === 0 ? (
        <div className="grid grid-cols-[1fr_9rem]">
          <div className="px-4 py-3 text-sm text-muted-foreground">—</div>
          <div className="px-4 py-3 text-right text-sm text-muted-foreground">—</div>
        </div>
      ) : (
        results.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_9rem] border-b border-border/50 last:border-0">
            <div className="px-4 py-3 text-left text-sm">
              <div className="flex items-start gap-2.5">
                {r.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <span className="min-w-0 flex-1 break-words text-foreground">{r.detail}</span>
              </div>
            </div>
            <div className="px-4 py-3 text-right text-sm font-mono">
              <span className={r.passed ? "text-success" : "text-destructive"}>
                {r.passed ? r.points : 0}/{r.points} pts.
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

/** Tabla de intentos de una actividad automática (solo vista de estudiante). */
export function AttemptsTable({ attempts, maxScore }: { attempts: AttemptRow[]; maxScore: number }) {
  if (attempts.length === 0) return null
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border bg-card px-4 py-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          Intentos ({attempts.length})
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-card border-b border-border">
              <th className="w-16 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                N.°
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                Fecha
              </th>
              <th className="w-24 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                Estado
              </th>
              <th className="w-32 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                Calificación
              </th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.attemptNumber} className="border-b border-border/50 bg-background last:border-0">
                <td className="px-4 py-2.5 text-center font-mono text-sm text-foreground">{a.attemptNumber}</td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground">
                  {formatBogotaDateTime(a.createdAt)}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {a.passed ? (
                    <CheckCircle2 className="inline h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="inline h-4 w-4 text-destructive" />
                  )}
                </td>
                <td className="px-4 py-2.5 text-center font-mono text-sm text-foreground">{a.score}/{maxScore} pts.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
