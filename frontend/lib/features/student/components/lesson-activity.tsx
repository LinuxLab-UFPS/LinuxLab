"use client"

import { useSearchParams } from "next/navigation"
import { cn } from "@shared/lib/utils"
import { ActivityCard } from "@/lib/features/student/components/activity-card"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import { getActivity } from "@shared/lib/content/activities"
import { conOrigen } from "@shared/lib/next-url"

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
  const { scores } = usePassedActivities()
  const params = useSearchParams()

  const lista = slugs.map(getActivity).filter((a) => a !== undefined)
  if (lista.length === 0) return null

  // El contexto de la lección viaja en la URL por dos vías: los params
  // `tema`/`sub`, que el panel usa para ofrecer el tema que sigue, y `origen`,
  // que es lo que lee el botón de volver para regresar a ESTA lección y no a
  // un destino fijo.
  const tema = params.get("tema")
  const sub = params.get("sub")
  const destinoLeccion = tema ? `/curso?tema=${tema}${sub ? `&sub=${sub}` : ""}` : null
  const conContexto = (href: string) =>
    destinoLeccion
      ? conOrigen(`${href}&tema=${tema}${sub ? `&sub=${sub}` : ""}`, destinoLeccion)
      : href

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
            title={activity.title}
            description={activity.description}
            href={conContexto(activity.href)}
            estado={scores[activity.slug] ?? { score: null, maxScore: 100 }}
            dificultad={activity.difficulty}
            topicTitle={activity.topicTitle}
          />
        ))}
      </div>
    </div>
  )
}
