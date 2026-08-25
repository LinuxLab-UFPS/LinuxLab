"use client"

import { useSearchParams } from "next/navigation"
import { cn } from "@shared/lib/utils"
import { ActivityCard } from "@/lib/features/student/components/activity-card"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import { getActivity } from "@shared/lib/content/activities"

/**
 * Las actividades que ofrece una lección. La lección solo enseña la tarjeta:
 * al pulsarla se sale del curso y la actividad se abre junto a la terminal, que
 * es el único sitio donde se resuelven.
 *
 * Cuando la lección propone más de una, van bajo un solo encabezado y en la
 * misma fila. Antes cada directivo se pintaba por su cuenta y el encabezado
 * salía repetido, con una tarjeta debajo de otra.
 */
export function LessonActivity({ slugs }: { slugs: string[] }) {
  const { passed } = usePassedActivities()
  const params = useSearchParams()

  const lista = slugs.map(getActivity).filter((a) => a !== undefined)
  if (lista.length === 0) return null

  // El origen viaja en la URL: con él la actividad sabe a qué lección devolver
  // al estudiante y cuál es el tema que sigue.
  const tema = params.get("tema")
  const sub = params.get("sub")
  const conOrigen = (href: string) =>
    tema ? `${href}&tema=${tema}${sub ? `&sub=${sub}` : ""}` : href

  const varias = lista.length > 1

  return (
    <div className={cn("my-10", varias ? "" : "max-w-md")}>
      <h2 className="mb-4 text-left text-2xl font-bold text-foreground">
        Ponlo en práctica con {varias ? "estas" : "una"}{" "}
        <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text font-extrabold text-transparent">
          {varias ? "Actividades" : "Actividad"}
        </span>
      </h2>
      <div className={cn("grid gap-4", varias && "sm:grid-cols-2")}>
        {lista.map((activity) => (
          <ActivityCard
            key={activity.slug}
            activity={{ ...activity, href: conOrigen(activity.href) }}
            completed={passed.has(activity.slug)}
          />
        ))}
      </div>
    </div>
  )
}
