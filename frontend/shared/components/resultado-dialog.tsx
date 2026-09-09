"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"
import { cn } from "@shared/lib/utils"
import {
  AutomaticFeedbackColumns,
  AttemptsTable,
  type AttemptRow,
  type CheckFeedback,
} from "@shared/components/student-info-table"

/**
 * El resultado de comprobar una actividad.
 *
 * Se abre al terminar la comprobación y dice, de una, lo que el estudiante
 * quiere saber: si pasó, qué aserción falló y cómo le fue en los intentos
 * anteriores. Antes todo eso vivía debajo del enunciado, así que el veredicto
 * quedaba a un scroll de distancia del botón que acababa de pulsarse, y con el
 * enunciado largo no se veía nunca.
 *
 * El título es el veredicto, no un rótulo: es lo primero que se lee.
 */
export function ResultadoDialog({
  open,
  onOpenChange,
  passed,
  results,
  attempts,
  maxScore,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  passed: boolean
  results: CheckFeedback[]
  attempts: AttemptRow[]
  maxScore: number
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className={cn(passed ? "text-success" : "text-destructive")}>
            {passed ? "Actividad aprobada" : "Actividad no aprobada"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border border-border">
          <AutomaticFeedbackColumns results={results} />
        </div>

        {attempts.length > 0 && <AttemptsTable attempts={attempts} maxScore={maxScore} />}
      </DialogContent>
    </Dialog>
  )
}
