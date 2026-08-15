"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Skeleton } from "@shared/components/skeleton"

/**
 * Fullscreen simulator. "Salir" (and the simulator's own close message) goes
 * back to wherever you came from, be it the simulators page or a lesson.
 */
export function SimulatorPlayer({ src, title }: { src: string; title: string }) {
  const router = useRouter()
  // El `loading.tsx` de la ruta solo cubre hasta que responde el servidor; el
  // simulador es un HTML de mil lineas que descarga el navegador despues, y ese
  // tramo quedaba en blanco. El iframe avisa al terminar.
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.action === "close-simulator") router.back()
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [router])

  return (
    // Colores fijos y no tokens del tema: debajo hay un simulador que siempre
    // es oscuro, asi que en modo claro esta barra no debe volverse blanca. Mismo
    // criterio que la barra de ajustes de la terminal.
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0D1117]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <span className="text-sm font-medium text-white/80">{title}</span>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
          Salir
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        {!cargado && (
          <div role="status" aria-busy="true" className="absolute inset-0 p-4">
            <span className="sr-only">Cargando el simulador…</span>
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        )}
        <iframe
          src={src}
          onLoad={() => setCargado(true)}
          className="h-full w-full border-0"
          title={title}
          allow="same-origin"
        />
      </div>
    </div>
  )
}
