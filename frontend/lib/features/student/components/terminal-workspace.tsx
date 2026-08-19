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
  const open = Boolean(isStudent && ((activity && statement) || groupActivity))
  // Una actividad abierta manda: se ve aunque las sugerencias estén ocultas.
  const showColumn = isStudent && (open || hidden === false)

  // El enunciado necesita más columna que un par de tarjetas.
  const track = open ? "34rem" : "28rem"

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
