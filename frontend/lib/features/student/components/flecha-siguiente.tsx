"use client"

import { ArrowDown } from "lucide-react"
import { irA } from "@/lib/features/student/components/landing-header"

/**
 * La flecha del final del primer bloque, que baja al siguiente.
 *
 * Con los bloques a pantalla completa, quien llega no tiene forma de saber que
 * hay mas debajo: la primera pantalla se basta sola y no asoma nada por el
 * borde. Esta flecha es la unica pista.
 */
export function FlechaSiguiente({ hacia }: { hacia: string }) {
  return (
    // 44px de lado es el minimo comodo para tocar con el dedo; con 40 se falla.
    <button
      type="button"
      onClick={() => irA(hacia)}
      aria-label="Ver qué es LinuxLab"
      className="neon-glow hover:neon-glow-strong flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90"
    >
      <ArrowDown className="h-4 w-4" />
    </button>
  )
}
