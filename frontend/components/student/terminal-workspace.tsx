"use client"

import { useCallback, useState } from "react"
import { TerminalFrame } from "@/components/shared/terminal-frame"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"
import { TerminalSettingsBar } from "@/components/shared/terminal-settings-bar"
import { EssentialCommands } from "@/components/student/essential-commands"
import { SuggestedActivities } from "@/components/student/suggested-activities"
import { ActivityPanel } from "@/components/student/activity-panel"
import { useAuth } from "@/lib/features/auth/context"
import { apiFetch } from "@/lib/api/client"
import type { Activity } from "@/lib/features/shared/activities"

/**
 * The student's terminal and everything that sits around it: the suggested
 * activities on the left, the cheat sheet underneath, and — when an activity is
 * open — its statement in place of the suggestions.
 *
 * The teacher gets the console alone; the side column is study material.
 */
export function TerminalWorkspace({
  activity,
  statement,
}: {
  activity: Activity | null
  statement: string | null
}) {
  const { user } = useAuth()
  const [fontSize, setFontSize] = useState(user?.preferences?.terminalFontSize ?? 16)
  const [fontFamily, setFontFamily] = useState(
    user?.preferences?.terminalFontFamily ?? "Menlo, Monaco, 'Courier New', monospace",
  )
  const [resetKey, setResetKey] = useState(0)

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
  const open = isStudent && activity && statement

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div
        className={
          isStudent
            ? "flex h-[42rem] w-full max-w-7xl gap-6"
            : "flex h-[42rem] w-full max-w-5xl gap-6"
        }
      >
        {isStudent && (
          <aside className="flex h-full w-[26rem] shrink-0 flex-col">
            {open ? (
              <ActivityPanel activity={activity} statement={statement} />
            ) : (
              <SuggestedActivities />
            )}
          </aside>
        )}

        <div className="flex h-full min-w-0 flex-1 flex-col gap-4">
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
