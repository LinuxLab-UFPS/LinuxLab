"use client"

import { createContext, useContext, useState } from "react"

/**
 * Shares the current lesson's scroll progress so a thin bar can sit right under
 * the global header instead of inside the content column.
 *
 * Two contexts on purpose: the setter never changes, so the scroll container can
 * push updates without re-rendering on every scroll; only the bar (which reads
 * the value) re-renders.
 */
const ValueContext = createContext<number>(0)
const SetterContext = createContext<(v: number) => void>(() => {})

export function ReadingProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0)
  return (
    <SetterContext.Provider value={setProgress}>
      <ValueContext.Provider value={progress}>{children}</ValueContext.Provider>
    </SetterContext.Provider>
  )
}

export function useSetReadingProgress(): (v: number) => void {
  return useContext(SetterContext)
}

/** The minimalist reading-progress bar, pinned right under the header. */
export function ReadingProgressBar() {
  const progress = useContext(ValueContext)
  return (
    <div className="h-0.5 w-full shrink-0">
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%`, boxShadow: "var(--neon-glow)" }}
      />
    </div>
  )
}
