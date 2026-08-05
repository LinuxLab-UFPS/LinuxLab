"use client"

import { useCallback, useEffect, useState } from "react"
import { PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { CollapsedPanelButton } from "@/components/shared/collapsed-panel-button"
import { TerminalFrame } from "@/components/shared/terminal-frame"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"
import { TerminalSettingsBar } from "@/components/shared/terminal-settings-bar"
import { EssentialCommands } from "@/components/student/essential-commands"
import { SuggestedActivities } from "@/components/student/suggested-activities"
import { ActivityPanel } from "@/components/student/activity-panel"
import { useAuth } from "@/lib/features/auth/context"
import { apiFetch } from "@/lib/api/client"
import type { Activity } from "@/lib/features/shared/activities"
import type { LessonRef } from "@/lib/features/shared/lessons"

const HIDDEN_KEY = "linuxlab:suggested-hidden"

/** La consola mide siempre lo mismo: ni la columna ni la hoja le quitan sitio. */
const TERMINAL_WIDTH = "min(64rem, calc(100vw - 6rem))"
const TERMINAL_HEIGHT = "min(38rem, calc(100vh - 18rem))"

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
  origin,
  next,
}: {
  activity: Activity | null
  statement: string | null
  origin?: string
  next?: LessonRef | null
}) {
  const { user } = useAuth()
  const [fontSize, setFontSize] = useState(user?.preferences?.terminalFontSize ?? 16)
  const [fontFamily, setFontFamily] = useState(
    user?.preferences?.terminalFontFamily ?? "Menlo, Monaco, 'Courier New', monospace",
  )
  const [resetKey, setResetKey] = useState(0)
  // null mientras no se ha leído el almacenamiento: sin eso, la primera pintura
  // arrancaría colapsada y el panel entraría con una animación que nadie pidió.
  const [hidden, setHidden] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HIDDEN_KEY)
      setHidden(stored === null ? true : stored === "true")
    } catch {
      setHidden(true)
    }
  }, [])

  const setHiddenPersisted = useCallback((next: boolean) => {
    setHidden(next)
    try {
      localStorage.setItem(HIDDEN_KEY, String(next))
    } catch {
      // Storage blocked: the choice just won't survive the session.
    }
  }, [])

  const handleFontSize = useCallback((size: number) => {
    setFontSize(size)
    apiFetch("/api/preferences", {
      method: "PUT",
      body: JSON.stringify({ terminalFontSize: size }),
    }).catch(() => {})
  }, [])

  const handleFontFamily = useCallback((family: string) => {
    setFontFamily(family)
    apiFetch("/api/preferences", {
      method: "PUT",
      body: JSON.stringify({ terminalFontFamily: family }),
    }).catch(() => {})
  }, [])

  const handleReset = useCallback(() => setResetKey((k) => k + 1), [])

  const isStudent = user?.role === "student"
  const open = Boolean(isStudent && activity && statement)
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
          // `h-0 min-h-full`: la columna se estira a lo que mida la fila pero no
          // la estira ella. Sin eso, un enunciado largo empujaba el alto de la
          // fila y el panel se quedaba sin tope contra el que hacer scroll.
          <aside className="flex h-0 min-h-full flex-col overflow-hidden">
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
              ) : (
                <SuggestedActivities onHide={() => setHiddenPersisted(true)} />
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
            tone="amber"
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

        <div className="flex min-w-0 flex-col gap-4">
          <div className="shrink-0" style={{ height: TERMINAL_HEIGHT }}>
            <TerminalFrame
              className="h-full"
              toolbar={
                <TerminalSettingsBar
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  onFontSizeChange={handleFontSize}
                  onFontFamilyChange={handleFontFamily}
                  onReset={handleReset}
                />
              }
            >
              <TerminalEmulator key={resetKey} fontSize={fontSize} fontFamily={fontFamily} />
            </TerminalFrame>
          </div>

          {isStudent && <EssentialCommands className="shrink-0" />}
        </div>
      </div>
    </div>
  )
}
