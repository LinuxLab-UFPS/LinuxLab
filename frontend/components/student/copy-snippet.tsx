"use client"

import { useCallback, useState } from "react"
import { Check, Copy } from "lucide-react"
import { ActionButton } from "@/components/shared/action-button"
import { getSnippet } from "@/lib/features/shared/snippets"

/**
 * Hands the student a block of text without showing it: he can copy it, but not
 * read it or retype it. What he does with it afterwards is the exercise.
 */
export function CopySnippet({ id }: { id: string }) {
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
    <div className="my-6 flex items-center gap-3">
      <ActionButton tone={copied ? "emerald" : "primary"} onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copiado" : snippet.label}
      </ActionButton>
      <p className="text-xs text-muted-foreground">
        No lo verás en pantalla: va directo a tu portapapeles.
      </p>
    </div>
  )
}
