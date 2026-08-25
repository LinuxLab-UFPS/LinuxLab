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
import { notify } from "@shared/lib/toast"

interface RegisterTeacherDialogProps {
  onRegister: (name: string, email: string, code: string) => Promise<unknown>
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
  const [code, setCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      notify.error(null, "El nombre del docente es requerido")
      return
    }
    if (!email.trim()) {
      notify.error(null, "El correo electrónico es requerido")
      return
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      notify.error(null, "El formato del correo no es válido")
      return
    }
    if (!code.trim()) {
      notify.error(null, "El código del docente es requerido")
      return
    }

    const created = await onRegister(name.trim(), email.trim(), code.trim())
    if (created) {
      setName("")
      setEmail("")
      setCode("")
      setOpen(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("")
      setEmail("")
      setCode("")
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
            <div className="space-y-2">
              <Label htmlFor="code" className="text-muted-foreground">
                Código
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: DOC-001"
                className="bg-secondary/30 border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
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
