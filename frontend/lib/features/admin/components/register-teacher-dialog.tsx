"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Plus } from "lucide-react"

interface RegisterTeacherDialogProps {
  onRegister: (name: string, email: string) => Promise<unknown>
  submitting: boolean
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterTeacherDialog({
  onRegister,
  submitting,
}: RegisterTeacherDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("El nombre del docente es requerido")
      return
    }
    if (!email.trim()) {
      setError("El correo electrónico es requerido")
      return
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("El formato del correo no es válido")
      return
    }

    try {
      await onRegister(name.trim(), email.trim())
      setName("")
      setEmail("")
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar docente")
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("")
      setEmail("")
      setError(null)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="border border-violet-500/40 bg-violet-500/15 text-violet-400 shadow-none hover:bg-violet-500/25">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Docente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Docente</DialogTitle>
          <DialogDescription>
            Ingresa los datos del docente para habilitar su acceso a la plataforma.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground">
                Nombre completo
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="bg-secondary/30 border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">
                Correo electrónico institucional
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej: juan.perez@ufps.edu.co"
                className="bg-secondary/30 border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="border border-violet-500/40 bg-violet-500/15 text-violet-400 shadow-none hover:bg-violet-500/25"
            >
              {submitting ? "Registrando…" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
