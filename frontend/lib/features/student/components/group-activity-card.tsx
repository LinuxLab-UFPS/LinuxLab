import Link from "next/link"
import { Target } from "lucide-react"
import { Tag, type TagTone } from "@shared/components/tag"
import type { GroupActivitySummary } from "@/lib/features/student/group-activities"

/** La nota se colorea por tramos: aprobada holgada, justa o insuficiente. */
function tonoDeNota(nota: number): TagTone {
  if (nota >= 80) return "emerald"
  if (nota >= 60) return "amber"
  return "rose"
}

/**
 * Una actividad de curso, la que crea el docente.
 *
 * El orden es el mismo que en las del catálogo: primero de qué va, y solo
 * después las etiquetas. Junto al título va únicamente el estado, que es lo que
 * cambia con el tiempo; el tipo y la nota van al pie, donde no compiten con el
 * enunciado por la primera lectura.
 */
export function GroupActivityCard({ activity }: { activity: GroupActivitySummary }) {
  const limiteAlcanzado =
    activity.attemptLimit != null && activity.attemptsCount >= activity.attemptLimit

  return (
    <Link
      href={`/terminal?ga=${activity.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02] hover:border-primary/50 hover:shadow-[var(--neon-glow-strong)]"
    >
      {/* `items-center`: el título se alinea con el centro del icono, como en
          las tarjetas del catálogo. */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Target className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {activity.title}
          </h3>
          {activity.completed && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Tag tone="sky">Completada</Tag>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {activity.description || "Sin instrucciones."}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Tag tone="neutral">
          {activity.activityType === "quiz" ? "Quiz" : "Taller"}
        </Tag>

        {/* Sin etiqueta de deshabilitada: una actividad apagada no deberia
            llegarle al estudiante, y eso se resuelve al listarlas, no aqui. */}
        {limiteAlcanzado && <Tag tone="rose">Límite alcanzado</Tag>}

        {activity.completed ? (
          activity.finalScore > 0 ? (
            <Tag tone={tonoDeNota(activity.finalScore)}>
              Calificación: {activity.finalScore}/100
            </Tag>
          ) : (
            <Tag tone="amber">Pendiente por calificar</Tag>
          )
        ) : (
          <Tag tone="neutral">Pendiente</Tag>
        )}
      </div>
    </Link>
  )
}
