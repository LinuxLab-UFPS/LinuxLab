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
  { id: "acerca-de", texto: "Acerca de" },
  { id: "temario", texto: "Temario" },
  { id: "autores", texto: "Autores y Dirección" },
]

/** El id manda sobre el hash: si el bloque no existe, no se hace nada. */
export function irA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function LandingHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#0a0a0a]">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-4 sm:px-6">
        {/* El mismo logo y el mismo sitio que en la barra del area de estudiante
            (`site-header.tsx`), para que la portada no parezca otra aplicacion. */}
        <span className="shrink-0 text-xl font-extrabold tracking-tight">
          <span className="text-primary [text-shadow:0_0_18px_rgba(196,30,58,0.55)]">
            Linux
          </span>
          <span className="text-white">Lab</span>
        </span>

        <div className="ml-auto flex items-center gap-1">
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
        </div>
      </nav>
    </header>
  )
}
