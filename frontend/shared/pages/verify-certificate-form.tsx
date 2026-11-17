"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck } from "lucide-react"

/**
 * Formulario para verificar un certificado escribiendo su codigo.
 *
 * El PDF trae un QR y un enlace directos a `/verificar/<codigo>`, pero quien
 * tiene el certificado impreso, o solo el codigo, necesitaba un sitio donde
 * escribirlo. No consulta nada por si mismo: lleva a la pagina del codigo,
 * que es la que verifica.
 */
export function VerifyCertificateForm() {
  const router = useRouter()
  const [code, setCode] = useState("")

  // Se quitan los espacios: al copiar el codigo de un PDF es facil arrastrar
  // uno al principio o al final, o un salto de linea.
  const limpio = code.replace(/\s+/g, "")

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!limpio) return
    router.push(`/verificar/${encodeURIComponent(limpio)}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <BadgeCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Verificar un certificado</h1>
            <p className="text-sm text-muted-foreground">Certificados emitidos por LinuxLab UFPS</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6">
          <label htmlFor="codigo" className="text-sm font-medium text-foreground">
            Código de verificación
          </label>
          <input
            id="codigo"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Aparece al pie del certificado"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground focus:border-primary"
          />
          <button
            type="submit"
            disabled={!limpio}
            className="mt-4 h-11 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Verificar
          </button>
        </form>
      </div>
    </main>
  )
}
