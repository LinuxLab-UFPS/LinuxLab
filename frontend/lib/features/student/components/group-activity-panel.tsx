"use client"

import { useState } from "react"
import { FolderOpen, Loader2, Send, ShieldCheck } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { Tag } from "@shared/components/tag"
import { BackButton } from "@shared/components/back-button"
import { ActionButton } from "@shared/components/action-button"
import { sendToTerminal } from "@/lib/features/student/terminal-input"
import { useEnLaCarpeta, useProgramaAPantallaCompleta } from "@/lib/features/student/use-cwd"
import {
  checkGroupActivity,
  submitGroupActivity,
  type GroupActivityDetail,
  type GroupCheckResult,
} from "@/lib/features/student/group-activities"
import { DENSE_PROSE } from "@shared/lib/content/prose"
import { DIFFICULTY_LABEL, DIFFICULTY_TONE } from "@shared/lib/content/activities"
import { notify } from "@shared/lib/toast"
import { StudentInfoTable, AttemptsTable } from "@shared/components/student-info-table"


/**
 * Una actividad de curso (creada por el docente) abierta junto a la terminal.
 *
 * Igual que las actividades del temario: los criterios no se muestran hasta
 * aprobar, y la solución se trabaja en la carpeta de trabajo de la actividad.
 * Al abrir, la terminal navega a esa carpeta (la cola del seam cubre el caso
 * de que la conexión aún no esté lista).
 */
export function GroupActivityPanel({ detail, userId: _userId }: { detail: GroupActivityDetail; userId: string }) {
  const [results, setResults] = useState<GroupCheckResult[] | null>(
    detail.lastAttempt?.results ?? null,
  )
  const [passed, setPassed] = useState(detail.lastAttempt?.passed ?? false)
  const [finalScore, setFinalScore] = useState(detail.finalScore)
  const [checking, setChecking] = useState(false)
  const [attemptsCount, setAttemptsCount] = useState(detail.attemptsCount)
  const [attempts, setAttempts] = useState(detail.attempts)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!detail.submission)
  const [submission, setSubmission] = useState(detail.submission)

  const closed = detail.dueAt ? new Date(detail.dueAt) <= new Date() : false
  const limitReached = detail.attemptLimit != null && attemptsCount >= detail.attemptLimit
  /* Comprobar exige estar parado en la carpeta de trabajo. La ruta la dice la
     propia shell en cada prompt, asi que vale tanto si se llego con el boton
     como escribiendo `cd` a mano, y sobrevive a recargar la pagina. Mientras no
     se sepa la ruta el boton queda activo: la version que guardaba en React si
     se habia pulsado "ir a la carpeta" sacaba el boton gris tras cada recarga a
     quien ya estaba en el sitio correcto. */
  const enLaCarpeta = useEnLaCarpeta(detail.workdir)
  const canCheck =
    detail.evaluationType === "atomic" && detail.enabled && !closed && !limitReached &&
    enLaCarpeta

  /* Con `vi` abierto, lo que se manda a la terminal no se ejecuta: se teclea
     dentro del archivo, y en modo normal `c`, `d` y `~` son ordenes de edicion
     que lo estropean. Asi que el boton se apaga mientras dure. */
  const aPantallaCompleta = useProgramaAPantallaCompleta()

  const goToWorkdir = () => {
    if (aPantallaCompleta) return
    sendToTerminal(`mkdir -p ~/actividades/${detail.workdir} && cd ~/actividades/${detail.workdir}\n`)
  }

  const check = async () => {
    setChecking(true)
    try {
      const outcome = await checkGroupActivity(detail.id)
      setResults(outcome.results)
      setPassed(outcome.passed)
      setFinalScore(outcome.finalScore)
      setAttemptsCount(outcome.attemptsCount)
      setAttempts(outcome.attempts)
    } catch (e) {
      notify.error(e, "No se pudo comprobar tu entorno")
    } finally {
      setChecking(false)
    }
  }

  const isManual = detail.evaluationType === "manual"
  const canSubmit = isManual && detail.enabled && !closed && !submitted

  const handle_submit = async () => {
    setSubmitting(true)
    try {
      const result = await submitGroupActivity(detail.id)
      setSubmitted(true)
      setSubmission({
        id: result.id,
        status: result.status,
        score: null,
        feedback: null,
        submittedAt: result.submittedAt,
        files: 0,
      })
      notify.success("Actividad entregada")
    } catch (e) {
      notify.error(e, "No se pudo entregar la actividad")
    } finally {
      setSubmitting(false)
    }
  }

  const hasEntrega = isManual ? !!submission : attempts.length > 0

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-background p-5">
      <header className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          {/* Vuelve de donde se entró (catálogo, rendimiento...) vía el
              `origen` del enlace; sin origen, al catálogo de actividades. */}
          <BackButton fallback="/actividades" />
        </div>

        <div className="mt-4">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{detail.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Tag tone="brand">{detail.activityType === "quiz" ? "Quiz" : "Taller"}</Tag>
            <Tag tone="brand">
              {detail.evaluationType === "manual" ? "Revisión manual" : "Autoevaluación"}
            </Tag>
            {/* Misma escala del temario: el docente clasificó la actividad y
                viaja desde el backend para convivir con las del curso. */}
            <Tag tone={DIFFICULTY_TONE[detail.difficulty]}>
              {DIFFICULTY_LABEL[detail.difficulty]}
            </Tag>
          </div>
        </div>
        <div className="mt-2 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-mono">~/actividades/{detail.workdir}</span>
        </div>
      </header>

      <div className={cn("my-4 min-h-0 flex-1 overflow-y-auto pr-2", DENSE_PROSE)}>
        {detail.instructions ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {detail.instructions}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin instrucciones.</p>
        )}

        <div className="mt-6">
          <StudentInfoTable
            showIdentity={false}
            submittedAt={
              isManual
                ? (submission?.submittedAt ?? null)
                : (attempts.length > 0 ? attempts[0].createdAt : null)
            }
            statusNode={
              closed && !hasEntrega
                ? <Tag tone="rose">Vencida</Tag>
                : !hasEntrega
                  ? <Tag tone="muted">Pendiente de entrega</Tag>
                  : isManual
                    ? submission?.status === "graded"
                      ? <Tag tone="emerald">Calificada</Tag>
                      : <Tag tone="amber">Pendiente de revisión</Tag>
                    : <Tag tone="emerald">Calificada</Tag>
            }
            score={isManual ? (submission?.score ?? null) : (attempts.length > 0 ? finalScore : null)}
            maxScore={detail.maxScore}
            feedbackVariant={isManual ? "manual" : "automatic"}
            feedbackNode={
              isManual && submission?.feedback
                ? <p className="whitespace-pre-wrap text-muted-foreground">{submission.feedback}</p>
                : undefined
            }
            checks={isManual ? undefined : (results ?? detail.lastAttempt?.results ?? [])}
          />
        </div>

        {detail.evaluationType === "atomic" && attempts.length > 0 && (
          <div className="mt-4">
            <AttemptsTable attempts={attempts} maxScore={detail.maxScore} />
          </div>
        )}
      </div>

      <footer className="shrink-0 space-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isManual ? (
              !submitted && (
              <ActionButton
                tone="amber"
                onClick={handle_submit}
                disabled={submitting || !canSubmit}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? "Entregando..." : "Entregar actividad"}
              </ActionButton>
            )
          ) : (
            <ActionButton
              tone={passed ? "emerald" : "amber"}
              onClick={check}
              disabled={checking || !canCheck}
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {checking ? "Comprobando..." : "Comprobar actividad"}
            </ActionButton>
          )}
          </div>

          <ActionButton tone="neutral" onClick={goToWorkdir} disabled={aPantallaCompleta}>
            <FolderOpen className="h-4 w-4" />
            Ir a la carpeta
          </ActionButton>
        </div>

        {aPantallaCompleta ? (
          <p className="text-xs text-muted-foreground">
            Cierra el editor en la terminal para volver a usar estos botones.
          </p>
        ) : detail.evaluationType === "atomic" && !canCheck ? (
          <p className="text-xs text-muted-foreground">
              {!enLaCarpeta
               ? "Entra en la carpeta de la actividad para poder comprobarla: la revisión corre dentro de ella."
               : !detail.enabled
               ? "Esta actividad está deshabilitada por ahora. Habla con tu docente si crees que es un error."
              : closed
                ? "El plazo de esta actividad ya venció y no admite más comprobaciones. Habla con tu docente si necesitas una extensión."
                : limitReached
                  ? "Ya usaste todos los intentos que permitía esta actividad. Si crees que mereces una oportunidad más, habla con tu docente."
                  : null}
          </p>
        ) : null}
      </footer>
    </div>
  )
}
