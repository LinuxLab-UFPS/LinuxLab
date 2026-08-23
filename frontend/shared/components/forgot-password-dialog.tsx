"use client"

import { useState } from "react"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@shared/components/ui/dialog"
import { notify } from "@shared/lib/toast"
import { useAuth } from "@/lib/features/auth/context"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [debugLink, setDebugLink] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL_REGEX.test(trimmed)) {
      notify.error(null, "Ingresa un correo válido.")
      return
    }
    setSending(true)
    try {
      const { debugLink: link } = await sendPasswordReset(trimmed)
      if (link) setDebugLink(link)
      notify.success("Correo enviado. Revisa tu bandeja para restablecer tu contraseña.")
    } catch (err) {
      notify.error(err, "No se pudo enviar el correo.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recuperar contraseña</DialogTitle>
          <DialogDescription>Te enviaremos un enlace para restablecer tu contraseña.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Correo electrónico</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="tu@ufps.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          {debugLink ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-left">
              <p className="text-xs font-medium text-amber-800">[PoC] Enlace de prueba (solo dev):</p>
              <a href={debugLink} className="mt-1 block break-all text-xs text-primary underline">
                {debugLink}
              </a>
              <p className="mt-1 text-[11px] text-muted-foreground">Abre el enlace para probar el restablecimiento. En producción se enviará por email.</p>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setDebugLink(null); onOpenChange(false) }} disabled={sending}>
              {debugLink ? "Cerrar" : "Cancelar"}
            </Button>
            {!debugLink ? (
              <Button type="submit" disabled={sending} className="min-w-24">
                {sending ? "Enviando…" : "Enviar enlace"}
              </Button>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
