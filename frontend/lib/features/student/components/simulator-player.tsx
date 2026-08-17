"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@shared/components/skeleton"

/**
 * Fullscreen simulator. El simulador ocupa la pantalla entera: la salida vive
 * en su propia barra superior, que es la misma en los cuatro, y avisa por
 * `postMessage`. Antes habia una segunda barra aqui encima con el titulo y su
 * propio "Salir", y quedaban dos barras apiladas diciendo casi lo mismo.
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
