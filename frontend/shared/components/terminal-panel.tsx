"use client"

import { TerminalFrame } from "@shared/components/terminal-frame"
import { TerminalEmulator } from "@shared/components/terminal-emulator"
import { TerminalSettingsBar } from "@shared/components/terminal-settings-bar"
import { EssentialCommands } from "@/lib/features/student/components/essential-commands"
import { useTerminalPreferences } from "@shared/hooks/use-terminal-preferences"

export function TerminalPanel({ onClose }: { onClose: () => void }) {
  const { fontSize, fontFamily, handleFontSize, handleFontFamily } = useTerminalPreferences()

  return (
    // Altura fija y pegada: la terminal no puede irse de la pantalla mientras
    // se lee la leccion, y xterm necesita un alto definido para ajustarse.
    <aside className="sticky top-[66px] flex h-[calc(100vh-66px)] w-[38%] min-w-[360px] shrink-0 flex-col gap-3 bg-background py-4">
      <TerminalFrame
        className="min-h-0 flex-1"
        onClose={onClose}
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

      <EssentialCommands className="shrink-0" />
    </aside>
  )
}
