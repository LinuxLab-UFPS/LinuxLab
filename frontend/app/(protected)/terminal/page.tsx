"use client"

import { TerminalFrame } from "@/components/shared/terminal-frame"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"
import { TerminalSidePanels } from "@/components/student/terminal-side-panels"

export default function TerminalPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
            Terminal
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-[#ff5470] to-[#C41E3A]" />
        <p className="mt-4 max-w-xl text-muted-foreground">
          Tu terminal Linux real, lista para practicar. Ejecuta comandos, explora el
          sistema y resuelve las actividades sugeridas para reforzar cada tema.
        </p>
      </div>

      {/* Fixed height row: the side column scrolls internally instead of growing,
          so switching between the list and the activity detail never shifts the
          terminal's position. */}
      <div className="flex h-[32rem] gap-6">
        <TerminalFrame className="h-full flex-1 border-primary shadow-[var(--neon-glow-strong)]">
          <TerminalEmulator />
        </TerminalFrame>
        <div className="flex h-full w-[26rem] shrink-0 flex-col gap-4 overflow-y-auto">
          <TerminalSidePanels />
        </div>
      </div>
    </div>
  )
}
