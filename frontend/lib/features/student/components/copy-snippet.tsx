"use client"

import { useCallback, useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ActionButton } from "@shared/components/action-button"
import { getSnippet } from "@shared/lib/content/snippets"

/**
 * Hands the student a block of text without showing it: they can copy it, but
 * not read it or retype it. What they do with it afterwards is the exercise.
 *
 * `className` replaces the standalone spacing, so a check can embed the button
 * inside its own card instead of leaving it loose in the lesson.
 */
export function CopySnippet({ id, className }: { id: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const snippet = getSnippet(id)

  const copy = useCallback(async () => {
    if (!snippet) return
    try {
      await navigator.clipboard.writeText(snippet.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso de portapapeles no hay nada que hacer desde aquí.
    }
  }, [snippet])

  if (!snippet) return null

  return (
    <div className={cn("flex items-center gap-3", className ?? "my-6")}>
      <ActionButton tone={copied ? "emerald" : "primary"} onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copiado" : snippet.label}
      </ActionButton>
    </div>
  )
}
