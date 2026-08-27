"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, FolderOpen, Loader2, RotateCcw, ShieldCheck } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { Markdown } from "@shared/components/markdown"
import { ActionButton } from "@shared/components/action-button"
import { IconAction } from "@shared/components/icon-action"
import { ConfirmDialog } from "@/lib/features/admin/components/confirm-dialog"
import { sendToTerminal } from "@/lib/features/student/terminal-input"
import { useEnLaCarpeta } from "@/lib/features/student/use-cwd"
import { useActivityCheck } from "@/lib/features/student/use-activity-check"
import { DENSE_PROSE } from "@shared/lib/content/prose"
import {
  DIFFICULTY_TONE,
  DIFFICULTY_LABEL,
  type Activity,
} from "@shared/lib/content/activities"
import { Tag } from "@shared/components/tag"
import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"
import { StudentInfoTable, AttemptsTable } from "@shared/components/student-info-table"
import type { LessonRef } from "@shared/lib/content/lessons"


/**
 * An activity open next to the terminal: this is where activities are solved,
 * never inside the course.
 *
 * The header and the check button stay put while the statement scrolls on its
 * own, so the student never loses the button. What the laboratory looks at is
 * only listed once the activity is solved: an activity is a challenge, and
 * reading the assertions beforehand is reading the answer.
 */
export function ActivityPanel({
  activity,
  statement,
  origin,
  next,
}: {
  activity: Activity
  statement: string
  /** The lesson the student came from, if any. */
  origin?: string
  /** Where the course continues after that lesson. */
  next?: LessonRef | null
}) {
  const { activity: data, passed, loading, checking, check, reset, resetting } =
    useActivityCheck(activity.slug)

  /* Comprobar exige estar parado en la carpeta de la actividad. La ruta la dice
     la propia shell en cada prompt, asi que vale tanto si se llego con el boton
     como escribiendo `cd` a mano, y sobrevive a recargar la pagina. Mientras no
     se sepa la ruta el boton queda activo: bloquear en esa espera seria repetir
     el falso negativo que tenia la version anterior. */
  const enLaCarpeta = useEnLaCarpeta(data?.workdir)

  const goToWorkdir = () => {
    if (!data?.workdir) return
    sendToTerminal(`cd ~/actividades/${data.workdir}\n`)
  }

  /* Reiniciar borra la carpeta de la actividad y la vuelve a montar. Se
     pregunta antes porque el boton vive al lado del de ir a la carpeta, y
     confundirlos costaria el trabajo hecho. */
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-background p-5">
      <header className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={origin ?? "/terminal"}
            className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Link>

          {/* Sólo tiene sentido seguir el curso si vino de él y ya cumplió. */}
          {origin && next && passed && (
            <Link
              href={next.href}
              className="neon-glow hover:neon-glow-strong group inline-flex items-center gap-2 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90"
            >
              Siguiente tema
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        {/* El mismo orden que en la tarjeta: primero si esta completada,
            despues la nota del ultimo intento y al final la dificultad. */}
        <div className="mt-4">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{activity.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {passed && <Tag tone="sky">Completada</Tag>}
            {data?.lastAttempt && (
              <Tag tone={data.lastAttempt.score >= 60 ? "emerald" : "amber"}>
                {data.lastAttempt.score}/{data.maxScore}
              </Tag>
            )}
            {activity.difficulty && (
              <Tag tone={DIFFICULTY_TONE[activity.difficulty]}>
                {DIFFICULTY_LABEL[activity.difficulty]}
              </Tag>
            )}
          </div>
        </div>
      </header>

      <div className={cn("my-4 min-h-0 flex-1 overflow-y-auto pr-2", DENSE_PROSE)}>
        <div className="lesson-prose [&>*:first-child]:mt-0">
          <Markdown>{statement}</Markdown>
        </div>

        {loading ? (
          <SkeletonScreen className="mt-6 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-40" />
          </SkeletonScreen>
        ) : data ? (
          <div className="mt-6 space-y-4">
            <StudentInfoTable
              showIdentity={false}
              submittedAt={data.lastAttempt?.at ?? null}
              statusNode={
                !data.lastAttempt
                  ? <Tag tone="muted">Pendiente de entrega</Tag>
                  : <Tag tone="emerald">Calificada</Tag>
              }
              score={data.lastAttempt?.score ?? null}
              maxScore={data.maxScore}
              feedbackVariant="automatic"
              checks={data.lastAttempt?.results ?? []}
            />

            {data.attempts.length > 0 && (
              <AttemptsTable attempts={data.attempts} maxScore={data.maxScore} />
            )}
          </div>
        ) : null}
      </div>

      <footer className="shrink-0 space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <ActionButton
            tone={passed ? "emerald" : "amber"}
            onClick={check}
            disabled={checking || loading || !enLaCarpeta}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {checking ? "Comprobando..." : "Comprobar actividad"}
          </ActionButton>

          {/* Volver a la carpeta es lo que se hace muchas veces por sesion, asi
              que va como boton; rehacer los archivos se hace una vez y borra
              trabajo, asi que va como icono y pregunta antes. */}
          {data?.workdir && (
            <ActionButton tone="neutral" onClick={goToWorkdir}>
              <FolderOpen className="h-4 w-4" />
              Ir a la carpeta
            </ActionButton>
          )}

          {data?.hasSetup && data?.workdir && (
            <IconAction
              label={resetting ? "Preparando..." : "Reiniciar archivos (borra tu trabajo)"}
              icon={resetting ? Loader2 : RotateCcw}
              onClick={() => setConfirmando(true)}
              disabled={resetting || loading}
            />
          )}
        </div>

        {/* Un boton gris sin explicacion es peor que uno que no esta. */}
        {!enLaCarpeta && !loading && (
          <p className="text-xs text-muted-foreground">
            Entra en la carpeta de la actividad para poder comprobarla.
          </p>
        )}
      </footer>

      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title="¿Rehacer los archivos de la actividad?"
        description="Lo que hayas escrito dentro de su carpeta se pierde y vuelve a quedar como al principio. El resto de tu entorno no se toca."
        confirmLabel="Rehacer los archivos"
        confirmVariant="destructive"
        onConfirm={reset}
      />
    </div>
  )
}
