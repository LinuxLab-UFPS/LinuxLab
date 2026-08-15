"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, FolderOpen, Loader2, ShieldCheck } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ActionButton } from "@shared/components/action-button"
import { sendToTerminal } from "@/lib/features/student/terminal-input"
import { describeCheck } from "@/lib/features/student/use-activity-check"
import {
  checkGroupActivity,
  type GroupActivityDetail,
  type GroupCheckResult,
} from "@/lib/features/student/group-activities"
import { DENSE_PROSE } from "@shared/lib/content/prose"

const PILL = "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium"

/**
 * Una actividad de curso (creada por el docente) abierta junto a la terminal.
 *
 * Igual que las actividades del temario: los criterios no se muestran hasta
 * aprobar, y la solución se trabaja en la carpeta de trabajo de la actividad.
 * Al abrir, la terminal navega a esa carpeta (la cola del seam cubre el caso
 * de que la conexión aún no esté lista).
 */
export function GroupActivityPanel({ detail }: { detail: GroupActivityDetail }) {
  const [results, setResults] = useState<GroupCheckResult[] | null>(null)
  const [score, setScore] = useState(detail.lastAttempt?.score ?? 0)
  const [passed, setPassed] = useState(detail.lastAttempt?.passed ?? false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoCd = useRef(false)

  useEffect(() => {
    if (autoCd.current || !detail.workdir) return
    autoCd.current = true
    sendToTerminal(`mkdir -p ~/actividades/${detail.workdir} && cd ~/actividades/${detail.workdir}\n`)
  }, [detail.workdir])

  const goToWorkdir = () => {
    sendToTerminal(`mkdir -p ~/actividades/${detail.workdir} && cd ~/actividades/${detail.workdir}\n`)
  }

  const check = async () => {
    setChecking(true)
    setError(null)
    try {
      const outcome = await checkGroupActivity(detail.id)
      setResults(outcome.results)
      setScore(outcome.score)
      setPassed(outcome.passed)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo comprobar tu entorno")
    } finally {
      setChecking(false)
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
          <span
            className={cn(
              PILL,
              passed ? "border-sky-500/40 text-sky-400" : "border-border text-muted-foreground",
            )}
          >
            {passed ? "Completada" : "Sin completar"}
          </span>
          {detail.evaluationType === "manual" && (
            <span className={cn(PILL, "border-amber-500/40 text-amber-500")}>
              Revisión manual
            </span>
          )}
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

        <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">Carpeta de trabajo:</span>
          <span className="truncate font-mono text-foreground">
            ~/actividades/{detail.workdir}
          </span>
        </div>

        {(evaluated || detail.lastAttempt) && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-foreground">
              Calificación:{" "}
              <span className="font-mono font-medium text-foreground">
                {score}/{detail.maxScore}
              </span>
            </p>
            {results && (
              <ul className="space-y-1.5">
                {results
                  .filter((row) => row.passed)
                  .map((row) => (
                    <li key={row.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      <span className="text-foreground">{describeCheck(row.type, row.params)}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <footer className="shrink-0 space-y-3 border-t border-border pt-4">
        {error && (
          <p className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {detail.evaluationType === "manual" ? (
            <span className="text-xs text-muted-foreground">
              Esta actividad se entrega para revisión del docente.
            </span>
          ) : (
            <ActionButton tone={passed ? "emerald" : "amber"} onClick={check} disabled={checking}>
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {checking ? "Comprobando..." : "Comprobar actividad"}
            </ActionButton>
          )}

          <ActionButton tone="neutral" onClick={goToWorkdir}>
            <FolderOpen className="h-4 w-4" />
            Ir a la carpeta
          </ActionButton>
        </div>
      </footer>
    </div>
  )
}
