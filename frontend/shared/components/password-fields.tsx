"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { cn } from "@shared/lib/utils"
import { PASSWORD_HINT, confirmError, passwordError } from "@shared/lib/password"

/**
 * Contraseña nueva y su confirmacion, avisando mientras se escribe.
 *
 * Las tres pantallas que piden una contraseña nueva —el enlace de Firebase, la
 * creacion de cuenta del docente y el restablecimiento— tenian estos dos campos
 * copiados uno a uno, y las tres solo se quejaban al pulsar el boton: se
 * escribia una contraseña corta, se enviaba, y el aviso llegaba de vuelta como
 * un mensaje flotante cuando ya no se estaba mirando el campo. Aqui el error
 * sale al salir del campo y se apaga en cuanto queda bien.
 *
 * El error no se sube al padre: el padre vuelve a llamar a `passwordError` y
 * `confirmError` al enviar, que es la comprobacion que de verdad decide. Esto es
 * el aviso, no la puerta.
 */
export function PasswordFields({
  password,
  confirm,
  onPassword,
  onConfirm,
  disabled,
  label = "Nueva contraseña",
}: {
  password: string
  confirm: string
  onPassword: (value: string) => void
  onConfirm: (value: string) => void
  disabled?: boolean
  label?: string
}) {
  const [ver, setVer] = useState(false)
  const [passTocado, setPassTocado] = useState(false)
  const [confirmTocado, setConfirmTocado] = useState(false)

  const errorPass = passwordError(password, passTocado)
  const errorConfirm = confirmError(password, confirm, confirmTocado)

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="newPass">{label}</Label>
        <div className="relative">
          <Input
            id="newPass"
            type={ver ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            onBlur={() => setPassTocado(true)}
            aria-invalid={Boolean(errorPass)}
            aria-describedby="password-ayuda"
            disabled={disabled}
            className={cn("h-11 pr-10", errorPass && "border-danger")}
            placeholder={PASSWORD_HINT}
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            tabIndex={-1}
            aria-label={ver ? "Ocultar" : "Mostrar"}
          >
            {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p
          id="password-ayuda"
          className={cn("text-xs", errorPass ? "text-danger" : "text-muted-foreground")}
        >
          {errorPass ?? PASSWORD_HINT}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPass">Confirmar contraseña</Label>
        <Input
          id="confirmPass"
          type={ver ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => onConfirm(e.target.value)}
          onBlur={() => setConfirmTocado(true)}
          aria-invalid={Boolean(errorConfirm)}
          aria-describedby="confirm-ayuda"
          disabled={disabled}
          className={cn("h-11", errorConfirm && "border-danger")}
          placeholder="Repite la contraseña"
        />
        {errorConfirm ? (
          <p id="confirm-ayuda" className="text-xs text-danger">
            {errorConfirm}
          </p>
        ) : null}
      </div>
    </>
  )
}
