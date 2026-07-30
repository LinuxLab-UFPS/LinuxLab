"use client"

import { TerminalFrame } from "@/components/shared/terminal-frame"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"

/** The live terminal, framed like a real terminal window (traffic-light dots and
 *  a title bar) instead of a bare black block. */
export function TerminalPanel({ onClose }: { onClose: () => void }) {
  return (
    <aside className="flex w-[38%] min-w-[360px] shrink-0 flex-col bg-background py-4">
      <TerminalFrame onClose={onClose}>
        <TerminalEmulator />
      </TerminalFrame>
    </aside>
  )
}
