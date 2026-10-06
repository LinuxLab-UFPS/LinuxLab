"use client"

import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Textarea } from "@shared/components/ui/textarea"
import { currentBogotaInputValue, parseBogotaInput, toBogotaInputValue } from "@/lib/utils/dates"

/** La fecha de cierre tal como la guarda el input ("YYYY-MM-DD", o "" sin fecha). */
export function finishDateInputValue(autoFinishAt: string | null | undefined): string {
  return autoFinishAt ? toBogotaInputValue(autoFinishAt).slice(0, 10) : ""
}

/**
 * Los ajustes de cierre listos para el backend. El dia elegido se cierra a las
 * 23:59 de Bogota: el docente piensa en "el curso termina el viernes", no en
 * una hora, y finalizarlo a medianoche le quitaria el viernes entero.
 */
export function closingPayload(finishDate: string, minProgress: string) {
  return {
    autoFinishAt: finishDate ? parseBogotaInput(`${finishDate}T23:59`).toISOString() : null,
    minProgress: Number(minProgress) || 100,
  }
}

/**
 * Campos del formulario de grupo (nombre, descripcion y ajustes de cierre). Lo
 * comparten la creacion (/grupos/crear) y la edicion (/grupos/[id]/editar)
 * para que ambas pantallas pidan exactamente lo mismo con el mismo aspecto.
 */
export function GroupFormFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  finishDate,
  onFinishDateChange,
  minProgress,
  onMinProgressChange,
  disabled,
}: {
  name: string
  onNameChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  finishDate: string
  onFinishDateChange: (value: string) => void
  minProgress: string
  onMinProgressChange: (value: string) => void
  disabled?: boolean
}) {
  const today = currentBogotaInputValue().slice(0, 10)

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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="finishDate" className="text-muted-foreground">
            Fecha de finalización (opcional)
          </Label>
          <Input
            id="finishDate"
            type="date"
            min={today}
            value={finishDate}
            onChange={(e) => onFinishDateChange(e.target.value)}
            className="border-table-line"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Ese día a las 23:59 el curso se finaliza solo y se emiten los certificados. Sin
            fecha, lo finalizas tú.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minProgress" className="text-muted-foreground">
            Progreso mínimo para certificar (%)
          </Label>
          <Input
            id="minProgress"
            type="number"
            min={1}
            max={100}
            value={minProgress}
            onChange={(e) => onMinProgressChange(e.target.value)}
            className="border-table-line"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            El mismo progreso que ves en la tabla de estudiantes. 100 exige el curso completo.
          </p>
        </div>
      </div>
    </div>
  )
}
