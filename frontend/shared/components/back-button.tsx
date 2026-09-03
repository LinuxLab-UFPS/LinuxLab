"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@shared/components/ui/button"
import { esRutaInterna, destinoSeguro } from "@shared/lib/next-url"

/**
 * El botón de volver del sitio, en un solo componente.
 *
 * Mismo estilo que los botones de la app (`Button` outline con la flecha). La
 * navegación la resuelve él: si la URL trae `?origen=` con una ruta interna de
 * fiar, vuelve exactamente de donde se entró (catálogo, lección, mapa del
 * curso, rendimiento, búsqueda...); si no trae nada —o trae basura— cae al
 * `fallback` que cada vista declara, de modo que el botón siempre lleva a un
 * sitio con sentido aunque se abra la página en pestaña nueva o tras recargar.
 *
 * Cada punto de entrada estampa su `origen` en el enlace (ver
 * `esRutaInterna`); las vistas solo eligen el respaldo.
 */
export function BackButton({
  fallback,
  label = "Volver",
  className,
}: {
  /** A dónde ir cuando la URL no trae un origen válido. Obligatorio: el botón
      nunca queda sin destino. */
  fallback: string
  label?: string
  className?: string
}) {
  const params = useSearchParams()
  const origen = params.get("origen")
  const to = origen && esRutaInterna(origen) ? origen : destinoSeguro(fallback)

  return (
    <Button variant="outline" className={className} asChild>
      <Link href={to}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  )
}
