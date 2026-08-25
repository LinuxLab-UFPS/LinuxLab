"use client"

import { useState } from "react"
import { useAuth } from "@/lib/features/auth/context"
import { apiFetch } from "@/lib/api/client"
import { notify } from "@shared/lib/toast"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Button } from "@shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"

/**
 * Puerta de cuenta: si un estudiante inició sesión (p.ej. por Gmail) sin haber
 * definido su código, se le obliga a digitarlo antes de usar la plataforma.
 * Es global en las rutas protegidas porque es configuración de cuenta.
 */
export function StudentCodeGate() {
  const { user, hydrate } = useAuth()
  const [code, setCode] = useState("")
  const [saving, setSaving] = useState(false)

  const needsCode = !!user && user.role === "student" && !user.code

  if (!needsCode) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      notify.error(null, "Ingresa tu código de estudiante.")
      return
    }
    setSaving(true)
    try {
      await apiFetch("/api/students/me/code", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      })
      const me = await apiFetch<{ user: typeof user }>("/api/auth/me")
      hydrate(me.user)
      notify.success("Código guardado.")
    } catch (err) {
      notify.error(err, "No se pudo guardar el código.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) return
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Completa tu código de estudiante</DialogTitle>
          <DialogDescription>
            Necesitamos tu código de estudiante para identificarte en el curso. Es un dato
            obligatorio y no se puede omitir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student-code">Código de estudiante</Label>
            <Input
              id="student-code"
              autoComplete="off"
              placeholder="Ej. 202310123"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-11"
              disabled={saving}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={saving || !code.trim()} className="h-11 w-full">
            {saving ? "Guardando…" : "Guardar código"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
