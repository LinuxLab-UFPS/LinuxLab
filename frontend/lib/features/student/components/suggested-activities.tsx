"use client"

import { useMemo } from "react"
import { PanelLeft } from "lucide-react"
import { cn } from "@shared/lib/utils"
import Link from "next/link"
import { CollapsedPanelButton } from "@shared/components/collapsed-panel-button"
import { ActivityCard } from "@/lib/features/student/components/activity-card"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import { useLessonProgress } from "@/lib/features/student/progress"
import { getActivities } from "@shared/lib/content/activities"

const SHOWN = 4

/** Fisher-Yates sobre una copia: la sugerencia varía en cada visita. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * The activities offered next to the terminal: four still-pending ones, drawn at
 * random from the topics the student has already opened. Nothing from a topic he
 * has not reached yet, and nothing he already passed.
 *
 * La lista tiene su propio scroll y el encabezado se queda fijo: cuatro tarjetas
 * no caben en la columna y la última salía cortada por el recorte del aside.
 */
export function SuggestedActivities({
  onHide,
  visible,
}: {
  onHide: () => void
  visible: boolean
}) {
  const { passed, loading } = usePassedActivities()
  const { readCountForTopic } = useLessonProgress()

  const pending = useMemo(() => {
    if (loading) return []
    const seen = getActivities().filter(
      (a) => !passed.has(a.slug) && readCountForTopic(a.topicNumber) > 0,
    )
    return shuffle(seen).slice(0, SHOWN)
    // La baraja se fija por visita: rebarajar en cada render marearía al lector.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, passed])

  return (
    // El panel se cierra por fuera (la columna se pliega), así que su marco se
    // apaga antes: si no, se vería un borde encogiéndose mientras sale.
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col rounded-xl border bg-background p-5 transition-colors",
        visible ? "border-border" : "border-transparent",
      )}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Actividades recomendadas</h2>
        <CollapsedPanelButton
          tone="amber"
          label="Ocultar actividades"
          icon={PanelLeft}
          onClick={onHide}
          active
        />
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {loading ? "Buscando actividades…" : "No tienes actividades pendientes."}
        </p>
      ) : (
        // `-mx-3 px-3`: el recorte del scroll se comería el halo de las tarjetas
        // si la caja terminara justo en su borde, así que se ensancha y se
        // compensa con padding para que la columna siga alineada igual.
        <div className="-mx-3 min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-1">
          {pending.map((activity) => (
            <ActivityCard key={activity.slug} activity={activity} compact />
          ))}
          {/* Con la lista corta ya se ve todo, así que el enlace sobra. */}
          {pending.length === SHOWN && (
            <Link
              href="/activities"
              className="block rounded-md bg-amber-500/15 px-3 py-2 text-center text-sm font-semibold text-amber-500 transition-colors hover:bg-amber-500/25"
            >
              Ver más
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
