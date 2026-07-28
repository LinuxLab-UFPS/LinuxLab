"use client"

import { Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FloatingTerminalProps {
  onClick?: () => void
}

export function FloatingTerminal({ onClick }: FloatingTerminalProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-12 px-4 bg-primary text-primary-foreground hover:bg-primary/90 neon-glow hover:neon-glow-strong transition-all duration-300 gap-2 font-medium"
    >
      <Terminal className="w-5 h-5" />
      Terminal
    </Button>
  )
}
