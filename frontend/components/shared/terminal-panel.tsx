"use client"

import { useCallback, useState } from "react"
import { TerminalFrame } from "@/components/shared/terminal-frame"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"
import { TerminalSettingsBar } from "@/components/shared/terminal-settings-bar"
import { EssentialCommands } from "@/components/student/essential-commands"
import { useAuth } from "@/lib/features/auth/context"
import { apiFetch } from "@/lib/api/client"

export function TerminalPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [fontSize, setFontSize] = useState(user?.preferences?.terminalFontSize ?? 16)
  const [fontFamily, setFontFamily] = useState(
    user?.preferences?.terminalFontFamily ?? "Menlo, Monaco, 'Courier New', monospace",
  )
  const [resetKey, setResetKey] = useState(0)

  const handleFontSize = useCallback((size: number) => {
    setFontSize(size)
    apiFetch("/api/preferences", { method: "PUT", body: JSON.stringify({ terminalFontSize: size }) }).catch(() => {})
  }, [])

  const handleFontFamily = useCallback((family: string) => {
    setFontFamily(family)
    apiFetch("/api/preferences", { method: "PUT", body: JSON.stringify({ terminalFontFamily: family }) }).catch(() => {})
  }, [])

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1)
  }, [])

  return (
    <aside className="flex w-[38%] min-w-[360px] shrink-0 flex-col gap-3 bg-background py-4">
      <TerminalFrame
        className="min-h-0 flex-1"
        onClose={onClose}
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

      <EssentialCommands className="shrink-0" />
    </aside>
  )
}
