"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronDown, PanelLeft } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { PanelContenidos } from "@/lib/features/student/components/group-sidebar"
import type { LessonSubtopic } from "@/lib/models/content"
import type { TopicLessons } from "@shared/lib/content/lessons"

interface SidebarMovilProps {
  activeTopicSlug: string
  activeSubtopicId?: string
  contentSubtopics?: LessonSubtopic[]
  topicLessons: Record<number, TopicLessons>
  groupName?: string
  /** Lo que dice la barra cuando esta cerrada: donde esta el lector. */
  topicTitle: string
  lessonTitle?: string
}

/**
 * El panel de contenidos en pantalla estrecha.
 *
 * En escritorio vive en su columna de 320px; aqui no cabe, asi que se pliega a
 * una barra que dice donde estas y lo despliega al pulsarla.
 *
 * Dentro va el mismo `PanelContenidos` que usa la barra lateral, no una copia:
 * la lista de temas, el progreso y el estado de cada leccion se calculan en un
 * solo sitio y las dos vistas dicen lo mismo.
 */
export function SidebarMovil({ topicTitle, lessonTitle, ...panel }: SidebarMovilProps) {
  const [abierto, setAbierto] = useState(false)
  const ruta = usePathname()
  const params = useSearchParams()

  /* Se cierra al llegar a otra leccion. La navegacion del panel es por URL, no
     por estado, asi que sin esto el desplegable seguiria abierto encima del
     texto recien cargado. */
  useEffect(() => {
    setAbierto(false)
  }, [ruta, params])

  return (
    <div className="w-full md:hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-3 rounded-xl border border-black/15 bg-background px-3 py-2.5 text-left transition-colors hover:bg-secondary dark:border-border"
      >
        <PanelLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {topicTitle}
          </span>
          {lessonTitle && (
            <span className="block truncate text-xs text-muted-foreground">
              {lessonTitle}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            abierto && "rotate-180",
          )}
        />
      </button>

      {/* El plegado por `grid-rows` es el mismo truco de `essential-commands`:
          anima una altura que no se conoce de antemano, y aqui depende de
          cuantas lecciones tenga el tema abierto. */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          abierto ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <PanelContenidos {...panel} />
        </div>
      </div>
    </div>
  )
}
