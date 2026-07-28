'use client'

import { TerminalEmulator } from "@/components/shared/terminal-emulator"

export default function TerminalPage() {
  return (
    <div className="h-screen flex flex-col p-6">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Mi Terminal</h1>
        <p className="text-muted-foreground">
          Tu sesión Linux personal y persistente. Lo que crees aquí se conserva entre clases.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <TerminalEmulator />
      </div>
    </div>
  )
}
