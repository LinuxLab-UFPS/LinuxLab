"use client"

import { ThemeToggle } from "@shared/components/theme-toggle"

/**
 * La barra de la portada publica.
 *
 * No es la del resto del sitio (`SiteHeader`): esa lleva buscador, terminal y
 * el menu de la cuenta, y aqui todavia no hay cuenta. Esta solo mueve el scroll
 * entre los bloques.
 *
 * Los saltos van por `scrollIntoView` y no por `href="#id"` porque un ancla deja
 * el `#` pegado en la barra de direcciones y salta de golpe; asi se controla que
 * baje suave y la URL se queda limpia.
 */

const ENLACES = [
  { id: "que-es", texto: "¿Qué es?" },
  { id: "temario", texto: "Temario" },
  { id: "autores", texto: "Autores y Dirección" },
]

/** El id manda sobre el hash: si el bloque no existe, no se hace nada. */
export function irA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function LandingHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#0d1117]">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-center gap-1 px-6">
        {ENLACES.map((enlace) => (
          <button
            key={enlace.id}
            type="button"
            onClick={() => irA(enlace.id)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {enlace.texto}
          </button>
        ))}
        <ThemeToggle className="ml-2 text-white/70 hover:text-white" />
      </nav>
    </header>
  )
}
