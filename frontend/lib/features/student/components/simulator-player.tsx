"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Skeleton } from "@shared/components/skeleton"

/**
 * Fullscreen simulator. El simulador ocupa la pantalla entera: la salida vive
 * en su propia barra superior, que es la misma en los cuatro, y avisa por
 * `postMessage`. Antes habia una segunda barra aqui encima con el titulo y su
 * propio "Salir", y quedaban dos barras apiladas diciendo casi lo mismo.
 */
export function SimulatorPlayer({ src, title }: { src: string; title: string }) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  // El `loading.tsx` de la ruta solo cubre hasta que responde el servidor; el
  // simulador es un HTML de mil lineas que descarga el navegador despues, y ese
  // tramo quedaba en blanco. El iframe avisa al terminar.
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.action === "close-simulator") router.back()
      // A pantalla completa esta cabecera no se ve, asi que el simulador trae su
      // propio interruptor de tema y pide el cambio desde dentro. Lo aplicamos
      // aqui para que quede guardado como el del resto del sitio; el simulador
      // se entera solo, leyendo la clase de este documento.
      if (e.data?.action === "toggle-theme") {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [router, resolvedTheme, setTheme])

  return (
    // El fondo solo asoma mientras carga el iframe: va con el tema porque tres
    // de los cinco simuladores ya tienen modo claro.
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
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
