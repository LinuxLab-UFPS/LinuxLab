"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { Play } from "lucide-react"
import { LessonNav } from "@shared/components/lesson-nav"
import { LessonContainer } from "@shared/components/terminal-ui"
import type { LessonRef } from "@shared/lib/content/lessons"

export function SimulatorLesson({
  src,
  prev,
  next,
  currentTopicNumber,
}: {
  src: string
  prev: LessonRef | null
  next: LessonRef | null
  currentTopicNumber: number
}) {
  // Opened straight from a "play" link (e.g. the simulators list), it starts
  // fullscreen instead of showing the launcher card first.
  const searchParams = useSearchParams()
  const { resolvedTheme, setTheme } = useTheme()
  const [fullscreen, setFullscreen] = useState(() => searchParams.get("play") === "1")

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.action === 'close-simulator') setFullscreen(false)
      // El interruptor de tema de la barra del simulador: lo aplica el sitio,
      // que es quien guarda la preferencia, y el simulador se entera leyendo la
      // clase de este documento.
      if (e.data?.action === 'toggle-theme') {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [resolvedTheme, setTheme])

  if (fullscreen) {
    return (
      // Sin barra propia: la salida vive dentro del simulador, en la misma
      // barra que lleva el objetivo y los puntos.
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <iframe
          src={src}
          className="flex-1 w-full border-0"
          title="Simulador del sistema de archivos"
        />
      </div>
    )
  }

  return (
    <LessonContainer>
      <div className="mt-6 mb-10 rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-8 pt-10 pb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-500 mb-3">
            Práctica interactiva
          </p>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Travesía del Árbol
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
            Aplica lo que aprendiste. Usa <code className="text-foreground bg-secondary px-1 rounded">cd</code>, <code className="text-foreground bg-secondary px-1 rounded">ls</code> y <code className="text-foreground bg-secondary px-1 rounded">pwd</code> para navegar la jerarquía de Linux con objetivos y modos de juego.
          </p>
          <button
            onClick={() => setFullscreen(true)}
            className="inline-flex items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-all shadow-[0_0_20px_rgba(52,211,153,0.4)] hover:shadow-[0_0_32px_rgba(52,211,153,0.65)]"
          >
            <Play className="w-4 h-4" />
            Comenzar
          </button>
        </div>
      </div>

      <LessonNav currentTopicNumber={currentTopicNumber} prev={prev} next={next} />
    </LessonContainer>
  )
}
