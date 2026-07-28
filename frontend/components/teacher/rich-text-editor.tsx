"use client"

import { useState } from "react"
import { Bold, Italic, Code, List, ListOrdered } from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false)

  const toolbarButtons = [
    { icon: Bold, label: "Negrita", action: "bold" },
    { icon: Italic, label: "Cursiva", action: "italic" },
    { icon: Code, label: "Código", action: "code" },
    { icon: List, label: "Lista", action: "list" },
    { icon: ListOrdered, label: "Lista numerada", action: "ordered-list" },
  ]

  return (
    <div
      className={cn(
        "border border-border bg-secondary/30 transition-all duration-200",
        isFocused && "border-primary/50 ring-1 ring-primary/20"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-card/50">
        {toolbarButtons.map((button) => (
          <button
            key={button.action}
            type="button"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            title={button.label}
          >
            <button.icon className="w-4 h-4" />
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-1" />
        <span className="text-xs text-muted-foreground ml-auto">Markdown soportado</span>
      </div>

      {/* Editor area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full min-h-[200px] p-4 bg-transparent text-foreground text-sm placeholder:text-muted-foreground resize-y focus:outline-none font-mono leading-relaxed"
      />
    </div>
  )
}
