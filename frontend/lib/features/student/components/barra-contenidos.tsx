"use client"

import { useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Home, Menu } from "lucide-react"
import { PanelContenidos } from "@/lib/features/student/components/group-sidebar"
import { Dialog, DialogContent, DialogTitle } from "@shared/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@shared/components/ui/popover"
import { NeonProgress } from "@shared/components/neon-progress"
import { useCourseProgress } from "@/lib/features/student/course-progress"
import { syllabus } from "@shared/lib/content/temario"
import { useEsCompleta } from "@shared/hooks/use-talla"
import type { TopicLessons } from "@shared/lib/content/lessons"

interface BarraContenidosProps {
  activeTopicSlug: string
  activeSubtopicId?: string
  topicLessons: Record<number, TopicLessons>
  groupName?: string
  /** Sin progreso: quien lee el temario sin cursarlo. Ver `PanelContenidos`. */
  soloLectura?: boolean
  /** Lo que dice la barra: donde esta el lector. */
  topicTitle: string
  lessonTitle?: string
}

/**
 * Donde esta el lector, y la puerta al indice del curso.
 *
 * El indice fue una columna de 320px, y ese era el problema: la columna, la
 * leccion y la consola no caben a la vez por debajo de 1600. Se probo a plegarla
 * a mano, a plegarla sola, a recordar la decision y a limitar el ancho del
 * texto; cuatro piezas para repartir un sitio que no da.
 *
 * Ahora no hay columna. La leccion se lleva siempre lo que no use la consola, y
 * el indice se abre encima cuando se pide, como el de NetAcad. Consultarlo no
 * saca al lector de donde estaba, que es justo lo que se hace con un indice.
 *
 * Dos caras, segun quepa o no una capa flotante util:
 *
 *   desde `xl`   el boton de menu abre el indice anclado debajo, sin oscurecer
 *                el fondo. La barra es solo texto.
 *   por debajo   no hay boton: la barra entera abre el indice como modal
 *                centrado, que es lo unico que funciona en un telefono.
 *
 * Dentro va el mismo `PanelContenidos` en los dos casos, no una copia.
 */
export function BarraContenidos({ topicTitle, lessonTitle, ...panel }: BarraContenidosProps) {
  const ruta = usePathname()
  const params = useSearchParams()

  /* Se cierra al llegar a otra leccion, y por eso la ruta forma parte del
     estado. La navegacion del indice es por URL, no por estado: sin esto
     seguiria abierto encima del texto recien cargado. Derivado en el render y no
     con un efecto que llame a un setter, que es una cascada de renders. */
  const clave = `${ruta}?${params.toString()}`
  const [estado, setEstado] = useState({ clave, abierto: false })
  const abierto = estado.clave === clave && estado.abierto
  const cambiar = (v: boolean) => setEstado({ clave, abierto: v })

  /* El mismo calculo que pinta el panel por dentro. Aqui arriba es lo unico que
     se pierde al quitar la columna, asi que se queda a la vista: si no, para
     saber por donde va habria que abrir el indice cada vez. */
  const { cursoPct, temasCompletos } = useCourseProgress(panel.topicLessons, !panel.soloLectura)

  /* Cual de las dos capas se abre se decide en JS y no con clases, porque las
     dos se montan en un portal fuera de este arbol y un `xl:hidden` no alcanza
     ni al velo del modal ni a la logica del Popover. Aqui no hay parpadeo al
     cargar: cerradas no pintan nada.

     Y no basta con esconder el disparador: con el mismo estado gobernando las
     dos, en movil el Popover intentaba abrirse con su disparador en
     `display:none`, no encontraba a que anclarse, se cerraba solo y de paso
     apagaba el estado que el modal necesitaba. El modal no llegaba a abrirse
     nunca. */
  const completa = useEsCompleta()

  const donde = (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium text-foreground">{topicTitle}</span>
      {lessonTitle && (
        <span className="block truncate text-xs text-muted-foreground">{lessonTitle}</span>
      )}
    </span>
  )

  const progreso = panel.soloLectura ? null : (
    <span className="hidden w-24 shrink-0 sm:block">
      <span className="mb-1 block text-right text-xs tabular-nums text-muted-foreground">
        {temasCompletos}/{syllabus.length}
      </span>
      <NeonProgress value={cursoPct} className="h-1" />
    </span>
  )

  const marco =
    "flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-black/15 bg-background px-3 py-2.5 text-left shadow-sm dark:border-border"

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-6 flex items-center gap-2 bg-background px-4 py-2">
      {/* El atajo al inicio, fuera de la barra. Vivia en la cabecera del panel,
          donde solo se veia con el indice abierto; aqui esta siempre. Solo en
          escritorio: en movil ya esta el logo de la cabecera. */}
      <Link
        href="/inicio"
        title="Volver al inicio"
        aria-label="Volver al inicio"
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/15 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground dark:border-border xl:flex"
      >
        <Home className="h-4 w-4" />
      </Link>

      {/* En escritorio la barra entera abre el indice. Mientras solo lo abria el
          boton de menu, la barra era texto: con aspecto de boton invitaba a un
          clic que no hacia nada. Ahora que el menu de tres rayas ya dice que
          ahi hay un indice, pulsar cualquier parte es lo que se espera. Debajo
          de `xl` manda el boton de abajo, que abre el modal. */}
      <Popover open={abierto && completa === true} onOpenChange={cambiar}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Abrir los contenidos del curso"
            className={`${marco} group hidden transition-colors hover:bg-secondary data-[state=open]:bg-secondary xl:flex`}
          >
            <span
              aria-hidden
              className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors group-hover:text-foreground group-data-[state=open]:text-foreground"
            >
              <Menu className="h-4 w-4" />
            </span>
            {donde}
            {progreso}
          </button>
        </PopoverTrigger>
        {/* El panel es la capa flotante, sin caja alrededor: ya trae su marco.
            Su techo es el sitio que queda bajo la barra, que calcula Radix, y
            no un `86vh` fijo: con eso, en un portatil de 800 de alto, los
            ultimos temas se salian por el borde de la pantalla. */}
        <PopoverContent
          align="start"
          sideOffset={12}
          // Aire contra el borde de la pantalla, que Radix descuenta del alto
          // disponible de abajo.
          collisionPadding={12}
          className="max-h-[var(--radix-popover-content-available-height)] w-80 overflow-hidden border-0 p-0 shadow-2xl"
        >
          <PanelContenidos {...panel} compacto className="max-h-[var(--radix-popover-content-available-height)] shadow-none" />
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={() => cambiar(true)}
        aria-expanded={abierto}
        className={`${marco} transition-colors hover:bg-secondary xl:hidden`}
      >
        {donde}
        {progreso}
      </button>

      {/* El modal solo existe por debajo de `xl`; arriba manda el Popover. */}
      <Dialog open={abierto && completa === false} onOpenChange={cambiar}>
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
