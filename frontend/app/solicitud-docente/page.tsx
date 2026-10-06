"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { apiFetch } from "@/lib/api/client"
import { notify } from "@shared/lib/toast"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Textarea } from "@shared/components/ui/textarea"
import { Button } from "@shared/components/ui/button"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Formulario publico para que un docente pida su cuenta. No crea nada: deja la
 * solicitud para que el admin la apruebe desde /admin/docentes, y al aprobarla
 * le llega el mismo correo para configurar la cuenta que cuando el admin lo
 * registra a mano.
 */
export default function SolicitudDocentePage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [department, setDepartment] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return notify.error(null, "El nombre es requerido.")
    if (!EMAIL_REGEX.test(email.trim())) return notify.error(null, "El formato del correo no es válido.")
    if (!code.trim()) return notify.error(null, "El código docente es requerido.")

    setSubmitting(true)
    try {
      await apiFetch("/api/teacher-requests", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          code: code.trim(),
          department: department.trim() || null,
          message: message.trim() || null,
        }),
      })
      setSent(true)
    } catch (err) {
      notify.error(err, "No se pudo enviar la solicitud.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 shadow-xl">
        <Image src="/icon.svg" alt="" width={64} height={64} priority className="mx-auto mb-6 h-16 w-16" />

        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-success" />
            <h1 className="text-xl font-bold text-foreground">Solicitud enviada</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Un administrador revisará su solicitud. Cuando sea aprobada, recibirá un correo
              en {email.trim()} para configurar su cuenta.
            </p>
            <Button asChild variant="outline" className="mt-8 w-full">
              <Link href="/login">Volver al inicio de sesión</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-center text-2xl font-bold text-foreground">Solicitud de cuenta docente</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Complete sus datos. Un administrador revisará la solicitud y le enviará el acceso
              por correo.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@ufps.edu.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código docente</Label>
                <Input
                  id="code"
                  autoComplete="off"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Dependencia o programa (opcional)</Label>
                <Input
                  id="department"
                  placeholder="Ej: Ingeniería de Sistemas"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-11"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje (opcional)</Label>
                <Textarea
                  id="message"
                  rows={3}
                  maxLength={1000}
                  placeholder="Asignatura o curso en el que usará la plataforma"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none"
                  disabled={submitting}
                />
              </div>

              <Button type="submit" className="h-11 w-full" disabled={submitting}>
                {submitting ? "Enviando…" : "Enviar solicitud"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tiene cuenta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Inicie sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
