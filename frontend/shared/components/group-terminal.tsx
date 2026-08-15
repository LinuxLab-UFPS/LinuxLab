"use client"

import { FloatingTerminal } from "@shared/components/floating-terminal"
import { TerminalPanel } from "@shared/components/terminal-panel"
import { useTerminalUI } from "@shared/components/terminal-ui"

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
