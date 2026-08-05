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
 * The terminal is the only thing that takes up room: it stays centred and never
 * moves. The column hangs off its left margin, so opening or closing it — and
 * opening an activity — never resizes or shifts the console.
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
  const track = open ? "30rem" : "28rem"

  // La terminal es lo único que ocupa sitio, así que queda centrada y no se
  // mueve nunca: la columna cuelga de su margen izquierdo, en absoluto, y abrir
  // o cerrar no reacomoda nada. El ancho se recorta con la ventana para que ese
  // margen alcance a sostener la columna en pantallas normales.
  const TERMINAL = "clamp(32rem, calc(100vw - 63rem), 56rem)"

  return (
    <div className="flex h-full items-center justify-center px-6 py-8">
      <div className="relative h-full max-h-[42rem]" style={{ width: TERMINAL }}>
        {isStudent && (
          <aside
            className={cn(
              "absolute inset-y-0 right-full mr-6 flex flex-col transition-all duration-300 ease-out",
              showColumn
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-6 opacity-0",
            )}
            style={{ width: track }}
          >
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
          </aside>
        )}

        {/* Con la columna guardada, el cuadro es el único rastro de que ahí
            había algo. */}
        {isStudent && !showColumn && hidden && (
          <CollapsedPanelButton
            tone="amber"
            label="Mostrar actividades"
            icon={PanelLeft}
            onClick={() => setHiddenPersisted(false)}
            className="absolute top-0 right-full mr-6"
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
