"use client"

import { FloatingTerminal } from "@/components/shared/floating-terminal"
import { TerminalPanel } from "@/components/shared/terminal-panel"
import { useTerminalUI } from "@/components/shared/terminal-ui"

/** The floating terminal button + slide-in panel for the content view. */
export function GroupTerminal() {
  const { open, setOpen } = useTerminalUI()

  return (
    <>
      {open && <TerminalPanel onClose={() => setOpen(false)} />}
      {!open && <FloatingTerminal onClick={() => setOpen(true)} />}
    </>
  )
}
