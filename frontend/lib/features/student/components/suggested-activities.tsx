"use client"

import { useMemo } from "react"
import { PanelLeft } from "lucide-react"
import { cn } from "@shared/lib/utils"
import Link from "next/link"
import { CollapsedPanelButton } from "@shared/components/collapsed-panel-button"
import { Skeleton } from "@shared/components/skeleton"
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
        // La misma sombra que el panel de contenidos del curso, y por lo mismo:
        // en claro el borde solo no despega la caja del fondo.
        visible ? "border-border shadow-md dark:shadow-none" : "border-transparent",
      )}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Actividades recomendadas</h2>
        <CollapsedPanelButton
          label="Ocultar actividades"
          icon={PanelLeft}
          onClick={onHide}
          active
        />
      </div>

      {pending.length === 0 ? (
        loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">No hay más actividades disponibles</p>
          </div>
        )
      ) : (
        <>
          {/* El halo de las tarjetas mide 30px de desenfoque y el `scale` del
              hover añade un poco más: necesita unos 18px de aire por lado. Pedir
              `overflow-y-auto` convierte también el eje horizontal en recorte,
              así que la caja se ensancha 20px y se compensa con padding para que
              la columna siga alineada donde estaba. Con 12px el halo salía
              cortado. */}
          <div className="-mx-5 -mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-2">
            {pending.map((activity) => (
              <ActivityCard key={activity.slug} activity={activity} compact />
            ))}
          </div>
          {/* Fuera del área que hace scroll: el enlace es la salida de esta
              columna y tiene que estar a la vista haya cuatro tarjetas o
              quince, sin obligar a llegar al final para encontrarlo. */}
          <Link
            href="/actividades"
            className="mt-3 block shrink-0 rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver más
          </Link>
        </>
      )}
    </section>
  )
}
