"use client"

import { cn } from "@shared/lib/utils"
import { CheckBuilder, type ActivityCheck } from "@/lib/features/teacher/components/check-builder"
import type { EvaluationType } from "@/lib/features/teacher/types"

/** La escala de calificacion es fija: 0 a 100. */
const MAX_SCORE = 100

/**
 * Paso 2 del asistente: cómo se valida la actividad. Aquí vive la modalidad
 * (aserciones automáticas o revisión manual) y, en la primera, el constructor
 * de aserciones. El botón "Siguiente" queda bloqueado mientras la
 * configuración no sea publicable: sin aserciones o con un reparto que se pasa
 * de los 100 pts el backend rechazaría la actividad.
 */
export function ActivityChecksStep({
  evaluationType,
  onEvaluationTypeChange,
  checks,
  onChecksChange,
  distributeEvenly,
  onDistributeChange,
}: {
  evaluationType: EvaluationType
  onEvaluationTypeChange: (v: EvaluationType) => void
  checks: ActivityCheck[]
  onChecksChange: (checks: ActivityCheck[]) => void
  distributeEvenly: boolean
  onDistributeChange: (v: boolean) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Validaciones (checks)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define las validaciones que se ejecutarán para evaluar la actividad.
        </p>
      </div>

      {/* Un riel con las dos modalidades: la elegida se levanta sobre el fondo. */}
      <div className="inline-flex items-center gap-1.5 rounded-xl bg-foreground/[0.08] p-1.5">
        {(
          [
            ["atomic", "Aserciones atómicas"],
            ["manual", "Revisión manual"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onEvaluationTypeChange(value)}
            className={cn(
              "h-9 rounded-lg px-3.5 text-sm font-medium transition-colors",
              evaluationType === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {evaluationType === "atomic" ? (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Las rutas son relativas a la carpeta de trabajo de la actividad: escribe
            solo el archivo o directorio que se va a verificar (ej:{" "}
            <code className="font-mono text-foreground">informe.txt</code>). Los{" "}
            {MAX_SCORE} pts se reparten entre las aserciones.
          </p>
          <CheckBuilder
            checks={checks}
            onChange={onChecksChange}
            activityValue={MAX_SCORE}
            distributeEvenly={distributeEvenly}
            onDistributeChange={onDistributeChange}
          />
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Cuando el estudiante envíe su trabajo debes revisar la entrega, asignar la
          calificación y escribir una retroalimentación o comentario.
        </p>
      )}
    </div>
  )
}
