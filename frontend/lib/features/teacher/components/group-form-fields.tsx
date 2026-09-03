"use client"

import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Textarea } from "@shared/components/ui/textarea"

/**
 * Campos del formulario de grupo (nombre y descripcion). Lo comparten la
 * creacion (/grupos/crear) y la edicion (/grupos/[id]/editar) para que ambas
 * pantallas pidan exactamente lo mismo con el mismo aspecto.
 */
export function GroupFormFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  disabled,
}: {
  name: string
  onNameChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="groupName" className="text-muted-foreground">
          Nombre del grupo
        </Label>
        <Input
          id="groupName"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Sistemas Operativos - 2026-I"
          className="border-table-line"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-muted-foreground">
          Descripción
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          placeholder="Breve descripción del grupo…"
          className="resize-none border-table-line"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
