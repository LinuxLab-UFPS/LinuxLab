"use client"

import { useCallback, useState } from "react"
import { X } from "lucide-react"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"
import { TerminalSettingsBar } from "@/components/shared/terminal-settings-bar"
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
    <aside className="flex w-[38%] min-w-[360px] shrink-0 flex-col bg-background py-4">
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-[#0c0c0e] shadow-lg">
        {/* Title bar */}
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 px-3">
          <span className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </span>
          <span className="flex-1 text-center font-mono text-xs text-white/50">
            student@linuxlab: ~
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar terminal"
            className="text-white/40 transition-colors hover:text-white/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Settings bar */}
        <div className="shrink-0 border-b border-white/10 bg-white/[0.02] px-2 py-1.5">
          <TerminalSettingsBar
            fontSize={fontSize}
            fontFamily={fontFamily}
            onFontSizeChange={handleFontSize}
            onFontFamilyChange={handleFontFamily}
            onReset={handleReset}
          />
        </div>

        {/* Terminal body */}
        <div className="flex-1 overflow-hidden p-2">
          <TerminalEmulator key={resetKey} fontSize={fontSize} fontFamily={fontFamily} />
        </div>
      </div>
    </aside>
  )
}
