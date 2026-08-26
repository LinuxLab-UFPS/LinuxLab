"use client"

import { useState } from "react"
import { Check, Link2, RefreshCw } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip"
import { notify, notifyPromise } from "@shared/lib/toast"
import { rotateGroupInvite } from "@/lib/features/teacher/data"

interface GroupInviteActionsProps {
  groupId: string
  token: string | null | undefined
  /** Se llama tras regenerar el token para que la query del grupo se refresque. */
  onRotated?: () => void
}

export function GroupInviteActions({ groupId, token, onRotated }: GroupInviteActionsProps) {
  const [rotating, setRotating] = useState(false)
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const url = token
    ? `${origin}/inscripcion?token=${encodeURIComponent(token)}&group=${encodeURIComponent(groupId)}`
    : ""

  const handleCopy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      notify.success("Vínculo copiado al portapapeles")
    } catch {
      notify.error(null, "No se pudo copiar el vínculo.")
    }
  }

  const handleRotate = async () => {
    setRotating(true)
    const res = await notifyPromise(rotateGroupInvite(groupId), {
      loading: "Generando vínculo…",
      success: "Vínculo actualizado",
      error: "No se pudo actualizar el vínculo.",
    })
    setRotating(false)
    if (res.ok) onRotated?.()
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="outline" onClick={handleCopy} disabled={!url}>
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            Compartir vínculo
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs break-all">{url || "Aún no hay vínculo"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRotate}
            disabled={rotating || !token}
            aria-label="Regenerar vínculo"
          >
            <RefreshCw className={rotating ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Regenerar el vínculo de inscripción (invalida los enlaces anteriores)
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
