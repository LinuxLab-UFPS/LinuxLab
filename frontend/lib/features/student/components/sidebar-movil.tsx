"use client"

import { useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { PanelLeft } from "lucide-react"
import { PanelContenidos } from "@/lib/features/student/components/group-sidebar"
import { Dialog, DialogContent, DialogTitle } from "@shared/components/ui/dialog"
import type { LessonSubtopic } from "@/lib/models/content"
import type { TopicLessons } from "@shared/lib/content/lessons"

interface SidebarMovilProps {
  activeTopicSlug: string
  activeSubtopicId?: string
  contentSubtopics?: LessonSubtopic[]
  topicLessons: Record<number, TopicLessons>
  groupName?: string
  /** Sin progreso: quien lee el temario sin cursarlo. Ver `PanelContenidos`. */
  soloLectura?: boolean
  /** Lo que dice la barra cuando esta cerrada: donde esta el lector. */
  topicTitle: string
  lessonTitle?: string
}

/**
 * El panel de contenidos en pantalla estrecha.
 *
 * En escritorio vive en su columna de 320px; aqui no cabe, asi que se pliega a
 * una barra que dice donde estas y abre el panel al pulsarla.
 *
 * La barra va pegada al tope y se queda ahi mientras se lee. Antes iba suelta en
 * el flujo, arriba del texto: a dos pantallazos de leccion quedaba fuera de
 * vista y para cambiar de tema habia que subir hasta el principio. Y se
 * desplegaba en su sitio, o sea que empujaba la leccion hacia abajo justo cuando
 * lo que se quiere es mirar la lista y saltar a otra parte; por eso ahora abre un
 * modal, que es lo mismo que hace la terminal en esta talla.
 *
 * Dentro va el mismo `PanelContenidos` que usa la barra lateral, no una copia:
 * la lista de temas, el progreso y el estado de cada leccion se calculan en un
 * solo sitio y las dos vistas dicen lo mismo.
 */
export function SidebarMovil({ topicTitle, lessonTitle, ...panel }: SidebarMovilProps) {
  const ruta = usePathname()
  const params = useSearchParams()

  /* Se cierra al llegar a otra leccion, y por eso la ruta forma parte del
     estado. La navegacion del panel es por URL, no por estado: sin esto el modal
     seguiria abierto encima del texto recien cargado. Derivado en el render y no
     con un efecto que llame a `setAbierto`, que es una cascada de renders. */
  const clave = `${ruta}?${params.toString()}`
  const [estado, setEstado] = useState({ clave, abierto: false })
  const abierto = estado.clave === clave && estado.abierto

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-6 bg-background px-4 py-2 xl:hidden">
      <button
        type="button"
        onClick={() => setEstado({ clave, abierto: true })}
        aria-expanded={abierto}
        className="flex w-full items-center gap-3 rounded-xl border border-black/15 bg-background px-3 py-2.5 text-left shadow-sm transition-colors hover:bg-secondary dark:border-border"
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
        <span className="shrink-0 text-xs text-muted-foreground">Contenidos</span>
      </button>

      <Dialog
        open={abierto}
        onOpenChange={(v) => setEstado({ clave, abierto: v })}
      >
        {/* Sin relleno: el panel ya trae su propia cabecera y su marco, asi que
            el modal es el panel y no una caja con otra caja dentro. */}
        <DialogContent className="h-[85dvh] w-[92vw] max-w-md gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Contenidos del curso</DialogTitle>
          <div className="flex h-full min-h-0 flex-col">
            <PanelContenidos {...panel} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
