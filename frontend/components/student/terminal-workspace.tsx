"use client"

import { useCallback, useEffect, useState } from "react"
import { PanelLeft } from "lucide-react"
import { CollapsedPanelButton } from "@/components/shared/collapsed-panel-button"
import { cn } from "@/lib/utils"
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

/**
 * The student's terminal and everything that sits around it: the suggested
 * activities on the left, the cheat sheet underneath, and — when an activity is
 * open — its statement in place of the suggestions.
 *
 * Hiding the suggestions collapses the whole column and narrows the row, so the
 * terminal slides across to the middle instead of leaving an empty gutter. The
 * column keeps its own width while it collapses, otherwise the cards would
 * reflow on the way out; it is the grid track that shrinks, not the content.
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

  // La terminal mide siempre lo mismo: la columna se abre a su lado y la fila
  // entera crece, en vez de que la consola encoja para hacerle sitio. El tope
  // por viewport es para que en pantallas cortas no se salga de cuadro.
  const TERMINAL = "min(64rem, calc(100vw - 6rem))"

  return (
    <div className="flex h-full items-center justify-center px-6 py-8">
      <div
        className={cn(
          "relative grid h-full max-h-[42rem] w-fit max-w-full",
          hidden !== null && "transition-all duration-300 ease-out",
        )}
        style={{
          gridTemplateColumns: `${showColumn ? track : "0rem"} ${TERMINAL}`,
          columnGap: showColumn ? "1.5rem" : "0rem",
        }}
      >
        {isStudent && (
          <aside className="flex h-full flex-col overflow-hidden">
            {/* Ancho propio: la columna se cierra por fuera y el contenido se
                queda quieto en vez de recomponerse mientras sale. El padding le
                deja sitio al halo de las tarjetas, que si no lo corta el
                recorte de esta caja. */}
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

        {/* Sin columna no queda dónde poner el control, así que el ojo se va al
            margen: el único rastro de que hay algo escondido. */}
        {isStudent && !showColumn && hidden && (
          <CollapsedPanelButton
            tone="amber"
            label="Mostrar actividades"
            icon={PanelLeft}
            onClick={() => setHiddenPersisted(false)}
            className="absolute top-0 right-full mr-4"
          />
        )}

        <div className="flex h-full min-w-0 flex-col gap-4">
          <TerminalFrame
            className="min-h-0 flex-1"
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

          {isStudent && <EssentialCommands className="shrink-0" />}
        </div>
      </div>
    </div>
  )
}
