"use client"

import { useMemo } from "react"
import Link from "next/link"
import { EyeOff } from "lucide-react"
import { ActivityCard } from "@/components/student/activity-card"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import { useLessonProgress } from "@/lib/features/student/progress"
import { getActivities } from "@/lib/features/shared/activities"

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
 * The cards are laid out without a scroller on purpose: a scrolling box clips
 * whatever leaves it, and the hover grows the card and throws a glow.
 */
export function SuggestedActivities({ onHide }: { onHide: () => void }) {
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
    <section className="flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-foreground">Actividades recomendadas</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/activities"
            className="rounded-md bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-500 transition-colors hover:bg-amber-500/25"
          >
            Ver más
          </Link>
          <button
            type="button"
            onClick={onHide}
            title="Ocultar actividades"
            aria-label="Ocultar actividades"
            className="rounded-md p-1 text-amber-500/70 transition-colors hover:text-amber-500"
          >
            <EyeOff className="h-4 w-4" />
          </button>
        </div>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {loading ? "Buscando actividades…" : "No tienes actividades pendientes."}
        </p>
      ) : (
        <div className="space-y-3">
          {pending.map((activity) => (
            <ActivityCard key={activity.slug} activity={activity} compact />
          ))}
        </div>
      )}
    </section>
  )
}
