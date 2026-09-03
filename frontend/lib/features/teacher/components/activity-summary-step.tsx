"use client"

import { CheckCircle2, ListChecks } from "lucide-react"
import { DIFFICULTY_LABEL, DIFFICULTY_TONE } from "@shared/lib/content/activities"
import { Tag } from "@shared/components/tag"
import { describeCheckShort } from "@shared/lib/describe-check"
import { getTopic } from "@shared/lib/content/temario"
import { formatBogotaDateTime, parseBogotaInput } from "@/lib/utils/dates"
import { cn } from "@shared/lib/utils"
import type { ActivityCheck, ActivityType, Difficulty, EvaluationType } from "@/lib/features/teacher/types"

/** La escala de calificacion es fija: 0 a 100. */
const MAX_SCORE = 100

function ResumenRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border/50 px-4 py-2.5 text-sm last:border-0">
      <span className="shrink-0 font-medium text-foreground">{label}</span>
      <span className="min-w-0 text-right text-muted-foreground">{children}</span>
    </div>
  )
}

/**
 * Paso 3 del asistente: la actividad completa antes de publicar. Es la misma
 * informacion de los pasos anteriores, en modo lectura; publicar es lo unico
 * que queda por decidir.
 */
export function ActivitySummaryStep({
  title,
  topic,
  difficulty,
  activityType,
  attemptLimit,
  dueDate,
  instructions,
  evaluationType,
  checks,
}: {
  title: string
  topic: string
  difficulty: Difficulty
  activityType: ActivityType
  attemptLimit: string
  dueDate: string
  instructions: string
  evaluationType: EvaluationType
  checks: ActivityCheck[]
}) {
  const topicInfo = getTopic(Number(topic) || 0)
  const total = checks.reduce((sum, c) => sum + (Number(c.points) || 0), 0)
  const isQuiz = activityType === "quiz"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Resumen de la actividad</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa la información antes de publicar la actividad.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-table-line bg-card">
        <div className="border-b border-table-line px-4 py-3.5">
          <p className="text-base font-semibold text-foreground">{title || "Sin título"}</p>
        </div>
        <ResumenRow label="Tema asociado">
          {topicInfo ? `${topicInfo.number}. ${topicInfo.title}` : "Sin tema"}
        </ResumenRow>
        <ResumenRow label="Dificultad">
          <Tag tone={DIFFICULTY_TONE[difficulty]}>{DIFFICULTY_LABEL[difficulty]}</Tag>
        </ResumenRow>
        <ResumenRow label="Tipo de actividad">
          {isQuiz ? "Quiz" : "Taller"}
          {isQuiz && attemptLimit ? ` · ${attemptLimit} intento(s)` : " · intentos ilimitados"}
        </ResumenRow>
        <ResumenRow label="Fecha de cierre">
          {/* El valor del input se interpreta en hora Bogotá, igual que al
              publicar; sin fecha se muestra tal cual. */}
          {dueDate ? formatBogotaDateTime(parseBogotaInput(dueDate)) : "Sin fecha"}
        </ResumenRow>
        <ResumenRow label="Modalidad">
          {evaluationType === "manual" ? "Revisión manual" : "Aserciones atómicas"}
        </ResumenRow>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Enunciado
        </h3>
        <div className="rounded-xl border border-table-line bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {instructions || <span className="text-muted-foreground">Sin enunciado.</span>}
        </div>
      </section>

      {evaluationType === "atomic" && (
        <section>
          <h3 className="mb-2 flex items-center justify-between gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <span className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Validaciones ({checks.length})
            </span>
            <span className="normal-case">
              Total:{" "}
              <span className={cn("font-mono font-semibold text-foreground")}>{total}</span>
              <span className="text-muted-foreground"> / {MAX_SCORE} pts</span>
            </span>
          </h3>
          <div className="overflow-hidden rounded-xl border border-table-line bg-card">
            {checks.map((check, index) => (
              <div
                key={check.id}
                className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-0"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  {/* Frase breve de qué hace la asercion: el resumen se lee
                      sin abrir el detalle ni conocer el catalogo. */}
                  <span className="block truncate text-sm text-foreground">
                    {check.params.ruta?.trim()
                      ? describeCheckShort(check.type, check.params)
                      : "Sin configurar"}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-sm text-muted-foreground">
                  {check.points} pts
                </span>
              </div>
            ))}
            {checks.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Sin aserciones: la actividad se publicará sin autoevaluación.
              </p>
            )}
          </div>
        </section>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-success/25 bg-success/5 px-4 py-3.5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <p className="text-sm leading-relaxed text-foreground">
          ¡Todo listo! Al publicar, la actividad quedará disponible para los
          estudiantes del curso{isQuiz && attemptLimit ? ` con un límite de ${attemptLimit} intento(s).` : "."}
        </p>
      </div>
    </div>
  )
}
