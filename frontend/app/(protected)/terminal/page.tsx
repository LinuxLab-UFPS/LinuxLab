"use client"

import { TerminalFrame } from "@/components/shared/terminal-frame"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"
import { TerminalSidePanels } from "@/components/student/terminal-side-panels"

export default function TerminalPage() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      {/* Fixed height row: the side panels always add up to this height (two
          boxes, no scroll), so switching to the activity detail never shifts
          the terminal. */}
      <div className="flex h-[38rem] w-full max-w-7xl gap-6">
        <TerminalFrame className="h-full flex-1">
          <TerminalEmulator />
        </TerminalFrame>
        <div className="flex h-full w-[26rem] shrink-0 flex-col gap-4">
          <TerminalSidePanels />
        </div>
      </div>
    </div>
  )
}
