"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Loader2 } from "lucide-react"

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
      // El simulador avisa en cuanto tiene algo que enseñar. `onLoad` sigue
      // puesto como red, pero llega tarde: espera al ultimo subrecurso y deja
      // el giro encima un rato despues de que el tablero ya se ve.
      if (e.data?.action === "simulator-ready") setCargado(true)
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
        {/* Un giro y no un esqueleto: el esqueleto promete la forma de lo que
            viene, y lo que viene es un simulador a pantalla completa, asi que
            prometia una sola caja gris del tamaño de la pantalla. Ni se parecia
            a lo que cargaba ni sabia estar en claro.

            Arranca por debajo de la barra —`top-16`, los 64px que mide la del
            simulador ya escalada— y no en `inset-0`: esa barra la pinta el
            propio iframe nada mas leer su HTML, mucho antes de que termine de
            cargar, asi que taparla era esconder algo que ya estaba listo. Se
            entra al simulador y la barra esta puesta desde el primer momento. */}
        {!cargado && (
          <div
            role="status"
            aria-busy="true"
            className="absolute inset-x-0 bottom-0 top-16 flex items-center justify-center bg-background"
          >
            <Loader2 className="h-9 w-9 animate-spin text-primary" />
            <span className="sr-only">Cargando el simulador…</span>
          </div>
        )}
        <iframe
          src={src}
          onLoad={() => setCargado(true)}
          // El negro de la barra del simulador. Un iframe es blanco hasta que su
          // documento pinta, y lo unico suyo que se ve antes de eso son los
          // 64px de la barra que el giro deja al aire: sin esto, en oscuro
          // salia una franja blanca ahi arriba durante un instante.
          className="h-full w-full border-0 bg-[#0a0a0a]"
          title={title}
          allow="same-origin"
        />
      </div>
    </div>
  )
}
