"use client"

import { useCallback, useState } from "react"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"
import { TerminalSettingsBar } from "@/components/shared/terminal-settings-bar"
import { RoleGuard } from "@/components/shared/role-guard"
import { useAuth } from "@/lib/features/auth/context"
import { apiFetch } from "@/lib/api/client"

export default function TerminalPage() {
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
    <RoleGuard roles={["student", "admin"]}>
      <div className="h-screen flex flex-col p-6">
        <div className="mb-4 shrink-0 space-y-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">Mi Terminal</h1>
            <p className="text-muted-foreground">
              Tu sesión Linux personal y persistente. Lo que crees aquí se conserva entre clases.
            </p>
          </div>
          <TerminalSettingsBar
            fontSize={fontSize}
            fontFamily={fontFamily}
            onFontSizeChange={handleFontSize}
            onFontFamilyChange={handleFontFamily}
            onReset={handleReset}
          />
        </div>
        <div className="flex-1 min-h-0">
          <TerminalEmulator key={resetKey} fontSize={fontSize} fontFamily={fontFamily} />
        </div>
      </div>
    </RoleGuard>
  )
}
