"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, FolderOpen, Loader2, Send, ShieldCheck, XCircle } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { Tag } from "@shared/components/tag"
import { ActionButton } from "@shared/components/action-button"
import { sendToTerminal } from "@/lib/features/student/terminal-input"
import {
  checkGroupActivity,
  submitGroupActivity,
  type GroupActivityDetail,
  type GroupCheckResult,
} from "@/lib/features/student/group-activities"
import { DENSE_PROSE } from "@shared/lib/content/prose"
import { notify } from "@shared/lib/toast"
import { formatBogotaDateTime } from "@/lib/utils/dates"


/**
 * Una actividad de curso (creada por el docente) abierta junto a la terminal.
 *
 * Igual que las actividades del temario: los criterios no se muestran hasta
 * aprobar, y la solución se trabaja en la carpeta de trabajo de la actividad.
 * Al abrir, la terminal navega a esa carpeta (la cola del seam cubre el caso
 * de que la conexión aún no esté lista).
 */
export function GroupActivityPanel({ detail, userId }: { detail: GroupActivityDetail; userId: string }) {
  const [results, setResults] = useState<GroupCheckResult[] | null>(
    detail.lastAttempt?.results ?? null,
  )
  const [score, setScore] = useState(detail.lastAttempt?.score ?? 0)
  const [passed, setPassed] = useState(detail.lastAttempt?.passed ?? false)
  const [completed, setCompleted] = useState(detail.completed)
  const [finalScore, setFinalScore] = useState(detail.finalScore)
  const [checking, setChecking] = useState(false)
  const [attemptsCount, setAttemptsCount] = useState(detail.attemptsCount)
  const [attempts, setAttempts] = useState(detail.attempts)
  const [openedFolder, setOpenedFolder] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!detail.submission)
  const [submission, setSubmission] = useState(detail.submission)

  const closed = detail.dueAt ? new Date(detail.dueAt) <= new Date() : false
  const limitReached = detail.attemptLimit != null && attemptsCount >= detail.attemptLimit
  const canCheck =
    detail.evaluationType === "atomic" && detail.enabled && !closed && !limitReached && openedFolder

  const goToWorkdir = () => {
    sendToTerminal(`mkdir -p ~/actividades/${detail.workdir} && cd ~/actividades/${detail.workdir}\n`)
    setOpenedFolder(true)
  }

  const check = async () => {
    setChecking(true)
    try {
      const outcome = await checkGroupActivity(detail.id)
      setResults(outcome.results)
      setScore(outcome.score)
      setPassed(outcome.passed)
      setCompleted(outcome.completed)
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
      setCompleted(true)
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

  const evaluated = results !== null

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-background p-5">
      <header className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Actividades
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{detail.title}</h1>
          <Tag tone={completed ? "sky" : "neutral"}>
            {completed
              ? isManual && submission?.status === "graded"
                ? `Calificada: ${submission.score}/${detail.maxScore}`
                : "Completada"
              : "Sin completar"}
          </Tag>
          <Tag tone="neutral">{detail.activityType === "quiz" ? "Quiz" : "Taller"}</Tag>
          {detail.evaluationType === "manual" && <Tag tone="primary">Revisión manual</Tag>}
          {closed && <Tag tone="rose">Vencida</Tag>}
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

        {(evaluated || detail.lastAttempt || detail.attemptsCount > 0) && (
          <div className="mt-6 space-y-3">
            {detail.activityType === "workshop" ? (
                <p className="text-sm text-foreground">
                  Calificación obtenida:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {finalScore}/{detail.maxScore}
                  </span>
                </p>
            ) : (
              <p className="text-sm text-foreground">
                Nota final:{" "}
                <span className="font-mono font-medium text-foreground">
                  {finalScore}/{detail.maxScore}
                </span>
              </p>
            )}

            {results && (
              <ul className="space-y-1.5">
                {results.map((row) => (
                  <li key={row.id} className="flex items-start gap-2.5 text-sm">
                    {row.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <span className="flex-1 text-foreground">{row.detail}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {row.passed ? row.points : 0}/{row.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-3 text-xs text-muted-foreground">
              <p>
                {attemptsCount} {attemptsCount === 1 ? "intento" : "intentos"}
                {detail.attemptLimit != null &&
                  ` de ${detail.attemptLimit}${limitReached ? " · límite alcanzado" : ""}`}
              </p>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-left">
                  <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 font-medium">N. intento</th>
                      <th className="px-3 py-2 font-medium">Fecha</th>
                      <th className="px-3 py-2 text-right font-medium">Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => (
                      <tr key={attempt.attemptNumber} className="border-t border-border/60 text-foreground">
                        <td className="px-3 py-2">{attempt.attemptNumber}</td>
                        <td className="px-3 py-2">{formatBogotaDateTime(attempt.createdAt)}</td>
                        <td className="px-3 py-2 text-right font-mono">{attempt.score}/{detail.maxScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {isManual && submission && (
          <div className="mt-6 space-y-3">
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 font-medium">Estado</th>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 text-right font-medium">Calificación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/60 text-foreground">
                    <td className="px-3 py-2">
                      {submission.status === "graded" ? "Calificada" : "Pendiente"}
                    </td>
                    <td className="px-3 py-2">{formatBogotaDateTime(submission.submittedAt)}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {submission.score != null ? `${submission.score}/${detail.maxScore}` : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {submission.feedback && (
              <div className="rounded-md border border-border bg-secondary/20 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">Retroalimentación</p>
                <p className="whitespace-pre-wrap text-sm text-foreground">{submission.feedback}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="shrink-0 space-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isManual ? (
              submitted ? (
                <span className="text-sm text-success">Enviada para revisión</span>
              ) : (
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

          <ActionButton tone="neutral" onClick={goToWorkdir}>
            <FolderOpen className="h-4 w-4" />
            Ir a la carpeta
          </ActionButton>
        </div>

        {detail.evaluationType === "atomic" && !canCheck && (
          <p className="text-xs text-muted-foreground">
              {!openedFolder
               ? "Primero abre la carpeta de trabajo."
               : !detail.enabled
               ? "La actividad está deshabilitada."
              : closed
                ? "La actividad venció."
                : limitReached
                  ? "Alcanzaste el límite de intentos de esta actividad."
                  : null}
          </p>
        )}
      </footer>
    </div>
  )
}
