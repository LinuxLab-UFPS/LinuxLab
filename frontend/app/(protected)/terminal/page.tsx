"use client"

import { useCallback, useState } from "react"
import { TerminalFrame } from "@/components/shared/terminal-frame"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"
import { TerminalSettingsBar } from "@/components/shared/terminal-settings-bar"
import { TerminalSidePanels } from "@/components/student/terminal-side-panels"
import { RoleGuard } from "@/components/shared/role-guard"
import { useAuth } from "@/lib/features/auth/context"
import { apiFetch } from "@/lib/api/client"

function TerminalContent() {
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

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1)
  }, [])

  return (
    <div className="flex h-full items-center justify-center px-6">
      {/* Fixed height row: the side panels always add up to this height (two
          boxes, no scroll), so switching to the activity detail never shifts
          the terminal. */}
      <div className="flex h-[38rem] w-full max-w-7xl gap-6">
        <TerminalFrame
          className="h-full flex-1"
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
        <div className="flex h-full w-[26rem] shrink-0 flex-col gap-4">
          <TerminalSidePanels />
        </div>
      </div>
    </div>
  )
}

export default function TerminalPage() {
  return (
    <RoleGuard roles={["student", "admin"]}>
      <TerminalContent />
    </RoleGuard>
  )
}
