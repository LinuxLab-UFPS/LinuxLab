"use client"

import { useCallback, useState } from "react"
import { Check, CornerDownLeft } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ActionButton } from "@shared/components/action-button"
import { getSnippet } from "@shared/lib/content/snippets"
import { sendToTerminal } from "../terminal-input"

/**
 * Hands the student a block of text without showing it: they can send it to
 * their terminal, but not read it or retype it. What they do with it afterwards
 * is the exercise.
 *
 * Antes esto copiaba al portapapeles, pero el pegado en la terminal esta
 * desactivado —se practica escribiendo—, asi que el bloque se escribe
 * directamente en ella. Va por el mismo canal que el `cd` de las actividades.
 *
 * OJO: el texto entra donde este el cursor. El enunciado manda abrir antes
 * `cat > logo.txt`, de modo que los saltos de linea caen dentro del archivo y
 * no los ejecuta la shell.
 *
 * `className` replaces the standalone spacing, so a check can embed the button
 * inside its own card instead of leaving it loose in the lesson.
 */
export function CopySnippet({ id, className }: { id: string; className?: string }) {
  const [enviado, setEnviado] = useState(false)
  const snippet = getSnippet(id)

  const enviar = useCallback(() => {
    if (!snippet) return
    // Sin salto final: lo pone el estudiante al cerrar con Ctrl+D, y asi el
    // archivo no acaba con una linea de mas que rompa la comprobacion.
    sendToTerminal(snippet.content)
    setEnviado(true)
    setTimeout(() => setEnviado(false), 2000)
  }, [snippet])

  if (!snippet) return null

  return (
    <div className={cn("flex items-center gap-3", className ?? "my-6")}>
      <ActionButton tone={enviado ? "emerald" : "primary"} onClick={enviar}>
        {enviado ? <Check className="h-4 w-4" /> : <CornerDownLeft className="h-4 w-4" />}
        {enviado ? "Escrito en la terminal" : snippet.label}
      </ActionButton>
    </div>
  )
}
