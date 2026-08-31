"use client"

import { Terminal } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { Button } from "@shared/components/ui/button"

interface FloatingTerminalProps {
  onClick?: () => void
  /**
   * Donde se coloca. Por defecto va clavado en la esquina; la guia del
   * laboratorio lo incrusta en el texto pasando su propia posicion.
   *
   * La posicion se separa del estilo a proposito: el boton de la guia tiene que
   * ser este mismo y no una copia parecida, porque lo que se esta enseñando es
   * exactamente el boton que el estudiante va a usar.
   */
  className?: string
}

export function FloatingTerminal({ onClick, className }: FloatingTerminalProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "h-12 px-4 bg-primary text-primary-foreground hover:bg-primary/90 neon-glow hover:neon-glow-strong transition-all duration-300 gap-2 font-medium",
        className ?? "fixed bottom-6 right-6",
      )}
    >
      <Terminal className="w-5 h-5" />
      Terminal
    </Button>
  )
}
