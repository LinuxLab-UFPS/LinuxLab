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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL_REGEX.test(trimmed)) {
      notify.error(null, "Ingresa un correo válido.")
      return
    }
    setSending(true)
    try {
      await sendPasswordReset(trimmed)
      notify.success("Correo enviado. Revisa tu bandeja para restablecer tu contraseña.")
      onOpenChange(false)
      setEmail("")
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={sending} className="min-w-24">
              {sending ? "Enviando…" : "Enviar enlace"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
