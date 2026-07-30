"use client"

import { TerminalFrame } from "@/components/shared/terminal-frame"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"
import { TerminalSidePanels } from "@/components/student/terminal-side-panels"

export default function TerminalPage() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="flex w-full max-w-7xl items-start gap-6">
        <div className="h-[32rem] flex-1">
          <TerminalFrame className="h-full">
            <TerminalEmulator />
          </TerminalFrame>
        </div>
        <div className="flex w-[26rem] shrink-0 flex-col gap-4">
          <TerminalSidePanels />
        </div>
      </div>
    </div>
  )
}
