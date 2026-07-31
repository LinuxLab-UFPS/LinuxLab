"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resetTerminal } from "@/lib/features/terminal/settings"

const FONTS = [
  { label: "Menlo (default)", value: "Menlo, Monaco, 'Courier New', monospace" },
  { label: "Fira Code", value: "'Fira Code', 'Cascadia Code', monospace" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { label: "Monospace", value: "monospace" },
]

interface Props {
  fontSize: number
  fontFamily: string
  onFontSizeChange: (size: number) => void
  onFontFamilyChange: (family: string) => void
  onReset?: () => void
}

export function TerminalSettingsBar({ fontSize, fontFamily, onFontSizeChange, onFontFamilyChange, onReset }: Props) {
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    setResetting(true)
    try {
      await resetTerminal()
      onReset?.()
    } catch {
      // error silencioso
    }
    setResetting(false)
  }

  return (
    // Colores fijos, no tokens del tema: esta barra vive dentro del marco de la
    // terminal, que siempre es oscuro, así que en modo claro no debe volverse
    // blanca. Aplica igual a la terminal del curso y a la pestaña Terminal.
    <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <label className="text-xs text-white/50">Tamaño:</label>
        <input
          type="range"
          min={12}
          max={24}
          step={1}
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="w-20 accent-primary"
        />
        <span className="w-6 text-xs text-white/50">{fontSize}px</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-white/50">Fuente:</label>
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className="rounded border border-white/10 bg-[#1a1d24] px-2 py-1 text-xs text-white/80 [color-scheme:dark]"
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        disabled={resetting}
        className="ml-auto gap-1.5 border-white/10 bg-white/5 text-xs text-white/80 hover:bg-white/10 hover:text-white dark:bg-white/5 dark:hover:bg-white/10"
      >
        <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
        {resetting ? "Reseteando..." : "Reset terminal"}
      </Button>
    </div>
  )
}
