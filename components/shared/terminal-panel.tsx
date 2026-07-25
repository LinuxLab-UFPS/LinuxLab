"use client"

import { X } from "lucide-react"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"

/** The live terminal, framed like a real terminal window (traffic-light dots and
 *  a title bar) instead of a bare black block. */
export function TerminalPanel({ onClose }: { onClose: () => void }) {
  return (
    <aside className="flex w-[38%] min-w-[360px] shrink-0 flex-col bg-background p-3">
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
        {/* Terminal body */}
        <div className="flex-1 overflow-hidden p-2">
          <TerminalEmulator />
        </div>
      </div>
    </aside>
  )
}
