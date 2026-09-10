"use client"

import { useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { PanelLeft, PanelLeftOpen } from "lucide-react"
import { PanelContenidos } from "@/lib/features/student/components/group-sidebar"
import { Dialog, DialogContent, DialogTitle } from "@shared/components/ui/dialog"
import { cn } from "@shared/lib/utils"
import { useClasesContenidos, useContenidos } from "@/lib/features/student/contenidos-ui"
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
 * El panel de contenidos plegado a una barra.
 *
 * Nacio para el movil, donde la columna de 320px no cabe, pero es la misma cara
 * plegada que hace falta en escritorio cuando la consola se lleva la derecha y
 * la leccion se queda sin ancho para leer. Quien decide cual de las dos caras se
 * ve es `useClasesContenidos`, para que no puedan verse las dos ni ninguna.
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
  const { barra } = useClasesContenidos()
  const { plegar } = useContenidos()

  /* Se cierra al llegar a otra leccion, y por eso la ruta forma parte del
     estado. La navegacion del panel es por URL, no por estado: sin esto el modal
     seguiria abierto encima del texto recien cargado. Derivado en el render y no
     con un efecto que llame a `setAbierto`, que es una cascada de renders. */
  const clave = `${ruta}?${params.toString()}`
  const [estado, setEstado] = useState({ clave, abierto: false })
  const abierto = estado.clave === clave && estado.abierto

  return (
    <div className={cn("sticky top-0 z-30 -mx-4 mb-6 flex items-center gap-2 bg-background px-4 py-2", barra)}>
      {/* Devolverla a su columna, en el mismo borde por el que se plego. Solo
          donde hay columna a la que volver: por debajo de `xl` no cabe. La
          barra sigue abriendo el modal al pulsarla; esto es lo unico que hace
          otra cosa, y por eso va fuera de ella. */}
      <button
        type="button"
        onClick={() => plegar(false)}
        title="Mostrar los contenidos en su columna"
        aria-label="Mostrar los contenidos en su columna"
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/15 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground dark:border-border xl:flex"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setEstado({ clave, abierto: true })}
        aria-expanded={abierto}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-black/15 bg-background px-3 py-2.5 text-left shadow-sm transition-colors hover:bg-secondary dark:border-border"
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
