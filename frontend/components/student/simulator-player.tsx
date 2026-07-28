"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

/**
 * Fullscreen simulator. "Salir" (and the simulator's own close message) goes
 * back to wherever you came from, be it the simulators page or a lesson.
 */
export function SimulatorPlayer({ src, title }: { src: string; title: string }) {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.action === "close-simulator") router.back()
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [router])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Salir
        </button>
      </div>
      <iframe src={src} className="w-full flex-1 border-0" title={title} allow="same-origin" />
    </div>
  )
}
