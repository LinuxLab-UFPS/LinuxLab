"use client"

import { useCallback, useState } from "react"
import { useAuth } from "@/lib/features/auth/context"
import { apiFetch } from "@/lib/api/client"

export const DEFAULT_TERMINAL_FONT_FAMILY = "Menlo, Monaco, 'Courier New', monospace"

/**
 * Preferencias de la terminal del usuario: tamaño y familia tipográfica.
 * Los cambios se aplican al instante y se persisten en el backend sin bloquear
 * la interfaz (un fallo de guardado no debe tumbar la sesión).
 */
export function useTerminalPreferences() {
  const { user } = useAuth()
  const [fontSize, setFontSize] = useState(user?.preferences?.terminalFontSize ?? 16)
  const [fontFamily, setFontFamily] = useState(
    user?.preferences?.terminalFontFamily ?? DEFAULT_TERMINAL_FONT_FAMILY,
  )

  const handleFontSize = useCallback((size: number) => {
    setFontSize(size)
    apiFetch("/api/preferences", {
      method: "PUT",
      body: JSON.stringify({ terminalFontSize: size }),
    }).catch(() => {})
  }, [])

  const handleFontFamily = useCallback((family: string) => {
    setFontFamily(family)
    apiFetch("/api/preferences", {
      method: "PUT",
      body: JSON.stringify({ terminalFontFamily: family }),
    }).catch(() => {})
  }, [])

  return { fontSize, fontFamily, handleFontSize, handleFontFamily }
}
