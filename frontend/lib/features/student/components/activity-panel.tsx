"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, FolderOpen, Loader2, RotateCcw, ShieldCheck } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { Markdown } from "@shared/components/markdown"
import { ActionButton } from "@shared/components/action-button"
import { BackButton } from "@shared/components/back-button"
import { IconAction } from "@shared/components/icon-action"
import { ConfirmDialog } from "@/lib/features/admin/components/confirm-dialog"
import { ResultadoDialog } from "@shared/components/resultado-dialog"
import { sendToTerminal } from "@shared/lib/terminal-session"
import { useEnElDirectorio, useProgramaAPantallaCompleta } from "@/lib/features/student/use-cwd"
import { useActivityCheck } from "@/lib/features/student/use-activity-check"
import { DENSE_PROSE } from "@shared/lib/content/prose"
import {
  DIFFICULTY_TONE,
  DIFFICULTY_LABEL,
  type Activity,
} from "@shared/lib/content/activities"
import { Tag } from "@shared/components/tag"
import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"
import { StudentInfoTable } from "@shared/components/student-info-table"
import type { LessonRef } from "@shared/lib/content/lessons"
import { useAccionesActividad } from "@/lib/features/student/acciones-actividad"
import { AvisoDirectorio, EsperaDirectorio } from "@/lib/features/student/components/aviso-directorio"
import { useUbicandoDirectorio } from "@/lib/features/student/directorio-terminal"


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

  /* El resultado se enseña en un modal en cuanto termina la comprobacion. Vivia
     debajo del enunciado, o sea a un scroll del boton que acababa de pulsarse, y
     con un enunciado largo no se veia nunca. */
  const [resultado, setResultado] = useState(false)
  /* Memorizado porque el efecto que publica los botones al modal de la terminal
     depende de el: sin identidad estable el efecto se disparaba en cada render
     y el ciclo publicar → estado → render tumbaba la pestaña. */
  const comprobar = useCallback(() => {
    check()
    setResultado(true)
  }, [check])

  /* Comprobar exige estar parado en el directorio de la actividad. La ruta la dice
     la propia shell en cada prompt, asi que vale tanto si se llego con el boton
     como escribiendo `cd` a mano, y sobrevive a recargar la pagina. Mientras no
     se sepa la ruta el boton queda activo: bloquear en esa espera seria repetir
     el falso negativo que tenia la version anterior. */
  const enElDirectorio = useEnElDirectorio(data?.workdir)

  /* Mientras la shell va de camino no se decide nada: ni el enunciado ni el
     aviso de estar fuera, que en ese hueco seria mentira a medias. */
  const ubicando = useUbicandoDirectorio() !== null || loading

  /* Con la terminal como modal, estos botones quedan detras justo cuando hacen
     falta. Se publican para que el modal los pinte en su pie; son los mismos
     manejadores, no una copia. */
  const { publicar } = useAccionesActividad()

  /* Con `vi` abierto, lo que se manda a la terminal no se ejecuta: se teclea
     dentro del archivo, y en modo normal `c`, `d` y `~` son ordenes de edicion
     que lo estropean. Asi que el boton se apaga mientras dure. */
  const aPantallaCompleta = useProgramaAPantallaCompleta()

  /* `mkdir -p` antes del `cd`, como hace el panel de las actividades del
     docente. El directorio lo monta `setup.py` al abrir la actividad, pero solo
     si esta trae archivos de partida: sin ellos el `cd` fallaba en silencio y el
     estudiante se quedaba en su home creyendo que ya estaba dentro, resolvia
     todo alli y la comprobacion no encontraba nada. `-p` no toca el directorio
     si ya existe, asi que en el caso normal no cambia nada. */
  const workdir = data?.workdir ?? null
  const goToWorkdir = useCallback(() => {
    if (!workdir || aPantallaCompleta) return
    sendToTerminal(`mkdir -p ~/actividades/${workdir} && cd ~/actividades/${workdir}\n`)
  }, [workdir, aPantallaCompleta])

  /* Reiniciar borra el directorio de la actividad y lo vuelve a montar. Se
     pregunta antes porque el boton vive al lado del de ir al directorio, y
     confundirlos costaria el trabajo hecho. */
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    publicar(
      <>
        <ActionButton
          tone={passed ? "emerald" : "amber"}
          onClick={comprobar}
          disabled={checking || loading || !enElDirectorio}
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {checking ? "Comprobando..." : "Comprobar"}
        </ActionButton>
        {/* Solo cuando hace falta: estando ya dentro no lleva a ningun sitio, y
            su presencia hacia dudar de si se estaba en el sitio correcto. */}
        {data?.workdir && !enElDirectorio && (
          <ActionButton tone="neutral" onClick={goToWorkdir} disabled={aPantallaCompleta}>
            <FolderOpen className="h-4 w-4" />
            Ir al directorio
          </ActionButton>
        )}
        {data?.hasSetup && data?.workdir && (
          <IconAction
            label={resetting ? "Preparando..." : "Reiniciar archivos"}
            icon={resetting ? Loader2 : RotateCcw}
            onClick={() => setConfirmando(true)}
            disabled={resetting || loading || aPantallaCompleta || !enElDirectorio}
          />
        )}
      </>,
    )
    return () => publicar(null)
    // Solo los datos, no las funciones: publicar JSX en cada render seria un bucle.
  }, [
    publicar, passed, checking, loading, enElDirectorio, aPantallaCompleta, resetting,
    data?.workdir, data?.hasSetup, comprobar, goToWorkdir,
  ])

  return (
    /* Sin tarjeta: el enunciado es todo este lado, no una ficha dentro de el.
       El `pr-1` deja respirar al texto frente a la consola sin meterle un marco
       en medio, y el resto del aire lo pone la columna. */
    <div className="flex h-full min-h-0 flex-col pr-1">
      <header className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          {/* Vuelve de donde se entró (catálogo, lección, rendimiento...) vía
              el `origen` que cada entrada estampa; sin origen, al catálogo. */}
          <BackButton fallback="/actividades" />

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
      </header>

      {/* `relative` para el aviso de directorio, que se pone encima del
          enunciado y de los botones. Ver `AvisoDirectorio`. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className={cn("my-4 min-h-0 flex-1 overflow-y-auto pr-2 scrollbar-siempre", DENSE_PROSE)}>
          {/* El titulo va con el enunciado y no clavado arriba: con el telefono
              de lado la cabecera fija se comia la mitad del alto. Quedan
              fijos solo Volver y los botones de abajo. */}
          <div className="mb-4">
          {/* El mismo orden que en la tarjeta: primero si esta completada,
              despues la nota del ultimo intento y al final la dificultad. */}
          <div>
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
          </div>

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
                checksInline={false}
              />
            </div>
          ) : null}
        </div>

        <footer className="shrink-0 space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <ActionButton
              tone={passed ? "emerald" : "amber"}
              onClick={comprobar}
              disabled={checking || loading || !enElDirectorio}
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {checking ? "Comprobando..." : "Comprobar actividad"}
            </ActionButton>

            {/* Aparece solo estando fuera: es la salida de ese estado, no un
                boton permanente. Rehacer los archivos se hace una vez y borra
                trabajo, asi que va como icono y pregunta antes. */}
            {data?.workdir && !enElDirectorio && (
              <ActionButton tone="neutral" onClick={goToWorkdir} disabled={aPantallaCompleta}>
                <FolderOpen className="h-4 w-4" />
                Ir al directorio
              </ActionButton>
            )}

            {data?.hasSetup && data?.workdir && (
              <IconAction
                label={resetting ? "Preparando..." : "Reiniciar archivos (borra tu trabajo)"}
                icon={resetting ? Loader2 : RotateCcw}
                onClick={() => setConfirmando(true)}
                // Rehacer los archivos desde fuera del directorio deja al
                // estudiante mirando una carpeta que no es la que cambio.
                disabled={resetting || loading || aPantallaCompleta || !enElDirectorio}
              />
            )}
          </div>

          {/* Un boton gris sin explicacion es peor que uno que no esta. Lo de
              estar fuera del directorio lo dice el aviso de abajo, que tapa esto
              entero. */}
          {aPantallaCompleta ? (
            <p className="text-xs text-muted-foreground">
              Cierra el editor en la terminal para volver a usar estos botones.
            </p>
          ) : null}
        </footer>

        {ubicando ? (
          <EsperaDirectorio />
        ) : data?.workdir && !enElDirectorio ? (
          <AvisoDirectorio
            workdir={data.workdir}
            onIr={goToWorkdir}
            deshabilitado={aPantallaCompleta}
          />
        ) : null}
      </div>

      <ResultadoDialog
        open={resultado && !checking}
        onOpenChange={setResultado}
        passed={data?.lastAttempt?.passed ?? false}
        results={data?.lastAttempt?.results ?? []}
        attempts={data?.attempts ?? []}
        maxScore={data?.maxScore ?? 100}
      />

      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title="¿Rehacer los archivos de la actividad?"
        description={
          `Se borra todo lo que haya en ~/actividades/${data?.workdir ?? ""} y se vuelven a ` +
          "crear de nuevo los archivos de la actividad. Tu directorio personal y el resto de tu " +
          "entorno no se tocan."
        }
        confirmLabel="Rehacer los archivos"
        confirmVariant="destructive"
        onConfirm={reset}
      />
    </div>
  )
}
