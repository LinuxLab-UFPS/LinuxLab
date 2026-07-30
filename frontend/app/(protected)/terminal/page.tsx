"use client"

import { TerminalFrame } from "@/components/shared/terminal-frame"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"
import { TerminalSidePanels } from "@/components/student/terminal-side-panels"

export default function TerminalPage() {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Mi Terminal</h1>
        <p className="text-muted-foreground">
          Tu sesión Linux personal y persistente. Lo que crees aquí se conserva entre clases.
        </p>
      </div>
      <div className="flex min-h-0 flex-1 gap-6">
        <TerminalFrame className="min-w-0">
          <TerminalEmulator />
        </TerminalFrame>
        <div className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
          <TerminalSidePanels />
        </div>
      </div>
    </div>
  )
}
