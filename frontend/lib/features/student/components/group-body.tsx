"use client"

import { useTerminalUI } from "@shared/components/terminal-ui"
import { cn } from "@shared/lib/utils"

/**
 * The group body row. While reading it's constrained to the header width
 * (aligned with the logo/profile); when the terminal opens it expands to fill
 * the screen, so the terminal never looks cramped. The width animates between
 * the two.
 */
export function GroupBody({ children }: { children: React.ReactNode }) {
  const { open } = useTerminalUI()
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 gap-6 overflow-hidden px-4 transition-[max-width] duration-300 ease-out sm:px-6",
        open ? "max-w-[120rem]" : "max-w-7xl",
      )}
    >
      {children}
    </div>
  )
}
