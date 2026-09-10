"use client"

import { useCallback, useEffect, useState } from "react"
import { PanelLeft } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { CollapsedPanelButton } from "@shared/components/collapsed-panel-button"
import { TerminalFrame } from "@shared/components/terminal-frame"
import { TerminalEmulator } from "@shared/components/terminal-emulator"
import { TerminalSettingsBar } from "@shared/components/terminal-settings-bar"
import { EssentialCommands } from "@/lib/features/student/components/essential-commands"
import { SuggestedActivities } from "@/lib/features/student/components/suggested-activities"
import { ActivityPanel } from "@/lib/features/student/components/activity-panel"
import { useAuth } from "@/lib/features/auth/context"
import { useTerminalPreferences } from "@shared/hooks/use-terminal-preferences"
import type { Activity } from "@shared/lib/content/activities"
import type { LessonRef } from "@shared/lib/content/lessons"
import type { GroupActivityDetail } from "@/lib/features/student/group-activities"
import { GroupActivityPanel } from "@/lib/features/student/components/group-activity-panel"
import { useEsCompleta } from "@shared/hooks/use-talla"
import { BotonTerminal, TerminalModal } from "@shared/components/terminal-modal"
import {
  AccionesActividadProvider,
  useAccionesActividad,
} from "@/lib/features/student/acciones-actividad"
import { useDirectorioAutomatico } from "@/lib/features/student/use-directorio-automatico"

const HIDDEN_KEY = "linuxlab:suggested-hidden"

/** El ancho de la consola: ni la columna ni la hoja le quitan sitio. */
const TERMINAL_WIDTH = "min(64rem, calc(100vw - 6rem))"

/**
 * El alto de la fila entera, y lo que mide tambien la columna de actividades.
 *
 * Antes el alto fijo era el de la consola y la tira de comandos se sumaba
 * debajo, asi que abrir o cerrar la tira cambiaba el alto de la fila y con el
 * la columna de la izquierda, que no tiene nada que ver con esa tira. Ahora el
 * que manda es este numero: la columna mide esto siempre, y dentro de la
 * derecha es la consola la que se estira o se encoge para dejarle sitio a la
 * tira. Cerrar los comandos alarga la consola hasta el bajo de la columna.
 */
const ALTO_FILA = "min(44rem, calc(100vh - 12rem))"

/**
 * The student's terminal and everything that sits around it: the suggested
 * activities on the left, the cheat sheet underneath, and — when an activity is
 * open — its statement in place of the suggestions.
 *
 * The console keeps its size throughout. Opening the column widens the row and
 * slides the terminal across; opening the cheat sheet adds a strip below it.
 * Neither one takes space away from the console itself.
 *
 * The teacher never gets the column: it is study material.
 */
export function TerminalWorkspace({
  activity,
  statement,
  groupActivity,
  origin,
  next,
}: {
  activity: Activity | null
  statement: string | null
  groupActivity: GroupActivityDetail | null
  origin?: string
  next?: LessonRef | null
}) {
  const { user } = useAuth()
  const { fontSize, fontFamily, handleFontSize, handleFontFamily } = useTerminalPreferences()
  // null mientras no se ha leído el almacenamiento: sin eso, la primera pintura
  // arrancaría colapsada y el panel entraría con una animación que nadie pidió.
  const [hidden, setHidden] = useState<boolean | null>(null)
  const completa = useEsCompleta()
  const [terminalAbierta, setTerminalAbierta] = useState(false)

  useEffect(() => {
    // Lectura unica de localStorage al montar (patron aceptado).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(
      (() => {
        try {
          const stored = localStorage.getItem(HIDDEN_KEY)
          return stored === null ? true : stored === "true"
        } catch {
          return true
        }
      })(),
    )
  }, [])

  const setHiddenPersisted = useCallback((next: boolean) => {
    setHidden(next)
    try {
      localStorage.setItem(HIDDEN_KEY, String(next))
    } catch {
      // Storage blocked: the choice just won't survive the session.
    }
  }, [])

  const isStudent = user?.role === "student"

  /* La terminal sigue a la pantalla: entra sola en el directorio de la actividad
     que se abre y vuelve al home al salir de ella. */
  useDirectorioAutomatico({
    activo: isStudent,
    slug: activity?.slug ?? null,
    workdirDeGrupo: groupActivity?.workdir ?? null,
  })

  const open = Boolean(isStudent && ((activity && statement) || groupActivity))
  // Una actividad abierta manda: se ve aunque las sugerencias estén ocultas.
  const showColumn = isStudent && (open || hidden === false)

  /* El enunciado necesita más columna que un par de tarjetas.
   *
   * Proporcional y no un numero fijo: la consola pide `TERMINAL_WIDTH` y no
   * cede, asi que con un ancho fijo la fila se pasaba del viewport y el
   * `max-w-full` la recortaba. Con `38vw` la columna se queda con lo que haya:
   * en una pantalla grande llega al tope de 44rem, y en una de 1440px se
   * encoge en vez de desbordar. */
  const track = open ? "min(44rem, 38vw)" : "28rem"

  /* El panel de la actividad, que es lo mismo en las dos maquetaciones. */
  const panel =
    activity && statement ? (
      <ActivityPanel activity={activity} statement={statement} origin={origin} next={next} />
    ) : groupActivity && user ? (
      <GroupActivityPanel detail={groupActivity} userId={user.id} />
    ) : null

  // Hasta saber la talla no se pinta: cada maquetacion mide distinto y
  // adivinar aqui provoca un salto al cargar.
  if (completa === undefined) return null

  /* Por debajo de 1280 no hay ancho para dos columnas: el enunciado se queda
     con la pantalla y la terminal se abre encima cuando hace falta. Los botones
     de la actividad viajan al pie del modal para poder trabajar sin cerrarlo. */
  if (!completa) {
    /* Sin actividad abierta esta pantalla es la terminal, y nada mas. Con el
       modal detras de un boton quedaba una pagina con unas tarjetas de
       sugerencias y un boton flotante: tres toques para llegar a lo que se venia
       a hacer. Las sugerencias no se pierden, estan en el catalogo de
       actividades, que es su sitio.

       Y va incrustada, no en el modal: solo puede haber una consola montada a la
       vez, asi que las dos formas son excluyentes. */
    if (!panel) {
      return (
        <div className="flex h-full flex-col gap-3 px-3 py-3">
          <div className="min-h-0 flex-1">
            <TerminalFrame
              className="h-full"
              toolbar={
                <TerminalSettingsBar
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  onFontSizeChange={handleFontSize}
                  onFontFamilyChange={handleFontFamily}
                />
              }
            >
              {/* Con el marco pegado al borde de la pantalla, la primera columna
                  quedaba en el filo. Mismo aire que en el modal. */}
              <div className="h-full px-2 py-1">
                <TerminalEmulator fontSize={fontSize} fontFamily={fontFamily} />
              </div>
            </TerminalFrame>
          </div>
        </div>
      )
    }

    /* Con una actividad abierta manda el enunciado: hay que leerlo para saber
       que escribir. La consola se abre encima, con los botones de la actividad
       en su pie para poder trabajar sin cerrarla. */
    return (
      <AccionesActividadProvider>
        <div className="flex h-full flex-col px-4 py-4">
          <div className="min-h-0 flex-1">{panel}</div>
          {!terminalAbierta && <BotonTerminal onClick={() => setTerminalAbierta(true)} />}
          <TerminalModalConAcciones open={terminalAbierta} onOpenChange={setTerminalAbierta} />
        </div>
      </AccionesActividadProvider>
    )
  }

  return (
    <div className="flex h-full items-center justify-center px-6 py-8">
      <div
        className={cn(
          "relative grid w-fit max-w-full",
          hidden !== null && "transition-all duration-300 ease-out",
        )}
        style={{
          gridTemplateColumns: `${showColumn ? track : "0rem"} ${TERMINAL_WIDTH}`,
          columnGap: showColumn ? "1.5rem" : "0rem",
        }}
      >
        {isStudent && (
          // Alto fijo y anclada arriba: mide ALTO_FILA pase lo que pase con la
          // tira de comandos de la derecha.
          <aside
            className="flex flex-col self-start overflow-hidden"
            style={{ height: ALTO_FILA }}
          >
            {/* Ancho propio: la columna se cierra por fuera y el contenido se
                queda quieto en vez de recomponerse mientras sale. El padding le
                deja sitio al halo de las tarjetas, que si no lo corta el recorte
                de esta caja. */}
            <div className="flex h-full shrink-0 flex-col px-6" style={{ width: track }}>
              {open && activity && statement ? (
                <ActivityPanel
                  activity={activity}
                  statement={statement}
                  origin={origin}
                  next={next}
                />
              ) : open && groupActivity ? (
                <GroupActivityPanel detail={groupActivity} userId={user.id} />
              ) : (
                <SuggestedActivities
                  onHide={() => setHiddenPersisted(true)}
                  visible={showColumn}
                />
              )}
            </div>
          </aside>
        )}

        {/* Con la columna abierta el interruptor vive en su cabecera, y éste
            ocupa su sitio cuando no la hay. Entra tarde a propósito: si apareciera
            de una, se solaparía con el otro mientras la columna se pliega y por
            un momento parecerían dos. */}
        {isStudent && !open && (
          <CollapsedPanelButton
            label="Mostrar actividades"
            icon={PanelLeft}
            onClick={() => setHiddenPersisted(false)}
            className={cn(
              "absolute top-0 right-full mr-6 transition-opacity",
              showColumn
                ? "pointer-events-none opacity-0 duration-100"
                : "opacity-100 delay-300 duration-200",
            )}
          />
        )}

        {/* El docente no lleva columna, y sin ella la consola sería el primer
            hijo de la rejilla: iría a parar al carril de 0rem. Se ancla al
            segundo, que es el suyo tenga o no vecina a la izquierda. */}
        <div
          className="flex min-w-0 flex-col gap-4"
          style={{ gridColumn: 2, height: ALTO_FILA }}
        >
          {/* `flex-1`: la consola se queda con lo que la tira de comandos no
              use, asi que al cerrarla crece hasta el bajo de la columna en vez
              de dejar un hueco. */}
          <div className="min-h-0 flex-1">
            <TerminalFrame
              className="h-full"
              toolbar={
                <TerminalSettingsBar
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  onFontSizeChange={handleFontSize}
                  onFontFamilyChange={handleFontFamily}
                />
              }
            >
              <TerminalEmulator fontSize={fontSize} fontFamily={fontFamily} />
            </TerminalFrame>
          </div>

          {isStudent && <EssentialCommands className="shrink-0" />}
        </div>
      </div>
    </div>
  )
}

/** El modal, ya dentro del proveedor, con las acciones que publique el panel. */
function TerminalModalConAcciones({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { acciones } = useAccionesActividad()
  return <TerminalModal open={open} onOpenChange={onOpenChange} acciones={acciones} />
}
