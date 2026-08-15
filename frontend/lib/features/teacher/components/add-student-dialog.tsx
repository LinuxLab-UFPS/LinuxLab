"use client"

import { useState } from "react"
import { UserPlus, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@shared/components/ui/dialog"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import type { EnrollmentStudent } from "@/lib/features/auth/types"

export function AddStudentDialog({
  open,
  busy,
  error,
  onSubmit,
  onOpenChange,
}: {
  open: boolean
  busy: boolean
  error: string | null
  onSubmit: (student: Omit<EnrollmentStudent, "id">) => void
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !code.trim()) return
    onSubmit({ name: name.trim(), email: email.trim(), code: code.trim() })
  }

  const change = (next: boolean) => {
    if (!next) {
      setName("")
      setEmail("")
      setCode("")
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-md">
        <div className="flex items-center justify-between gap-4 border-b border-table-line px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="h-4 w-4 text-primary" />
            Agregar estudiante
          </DialogTitle>
          <DialogClose
            aria-label="Cerrar"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="student-name">Nombre</Label>
            <Input
              id="student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ana Torres"
              className="border-table-line"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="student-email">Correo</Label>
            <Input
              id="student-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana.torres@ufps.edu.co"
              className="border-table-line"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="student-code">Código</Label>
            <Input
              id="student-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="1151234"
              className="border-table-line"
            />
          </div>

          {error && (
            <p className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !name.trim() || !email.trim() || !code.trim()}
            className="w-full rounded-md border border-primary/40 bg-primary/15 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/25 disabled:opacity-60"
          >
            {busy ? "Agregando..." : "Agregar al curso"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
