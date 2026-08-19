"use client"

import { useEffect, useRef } from "react"
import { useLessonProgress } from "@/lib/features/student/progress"
import { useSetReadingProgress } from "@shared/components/reading-progress"
import { LessonLoadingOverlay } from "@shared/components/lesson-loading"

/** Below this the lesson counts as read. Reaching an exact 100% is fiddly. */
const READ_AT = 95

/**
 * El ancestro que hace scroll, o `null` si el que scrollea es la ventana.
 *
 * Se busca en vez de recibirse para que este componente valga en las dos
 * disposiciones: la pagina del curso mete la leccion dentro de un `<main>` con
 * scroll propio (para que la barra del navegador no corra por al lado de la
 * cabecera), pero el mismo componente tiene que seguir midiendo bien si algun
 * dia cuelga directamente del documento.
 */
function scrollerDe(nodo: HTMLElement | null): HTMLElement | null {
  let padre = nodo?.parentElement ?? null
  while (padre) {
    const desborde = getComputedStyle(padre).overflowY
    if (desborde === "auto" || desborde === "scroll") return padre
    padre = padre.parentElement
  }
  return null
}

/**
 * Mide el avance de lectura de la leccion.
 *
 * No es un contenedor con scroll propio: scrollea un ancestro —el `<main>` de la
 * pagina del curso— o la ventana, asi que la rueda funciona en cualquier parte y
 * no solo sobre esta columna. Lo que queda aqui es la medida: informar a la
 * barra de progreso de debajo de la cabecera y marcar la leccion leida al
 * llegar al final.
 */
export function LessonScrollArea({
  topicNumber,
  subtopicId,
  children,
}: {
  topicNumber: number
  subtopicId: string | null
  children: React.ReactNode
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const { markRead } = useLessonProgress()
  const setProgress = useSetReadingProgress()

  useEffect(() => {
    const scroller = scrollerDe(contentRef.current)
    const diana: HTMLElement | Window = scroller ?? window

    // Este componente se remonta al cambiar de leccion (la `key` de ContentArea),
    // y eso no reinicia la posicion solo: si no, la leccion nueva se abriria por
    // donde se quedo la anterior.
    if (scroller) scroller.scrollTo(0, 0)
    else window.scrollTo(0, 0)

    const doc = document.documentElement
    let settle: ReturnType<typeof setTimeout> | undefined

    const update = () => {
      const alto = scroller ? scroller.scrollHeight : doc.scrollHeight
      const visible = scroller ? scroller.clientHeight : doc.clientHeight
      const arriba = scroller ? scroller.scrollTop : window.scrollY
      const max = alto - visible

      if (max <= 8) {
        // Nothing to scroll: a short lesson, or a simulator. It counts as read,
        // but only once the layout stops changing — images and video load late
        // and would otherwise mark it read before the content is even there.
        setProgress(100)
        clearTimeout(settle)
        if (subtopicId) {
          settle = setTimeout(() => markRead(topicNumber, subtopicId), 1200)
        }
        return
      }

      const value = Math.min(100, Math.round((arriba / max) * 100))
      setProgress(value)
      if (value >= READ_AT && subtopicId) markRead(topicNumber, subtopicId)
    }

    update()
    diana.addEventListener("scroll", update, { passive: true })

    // The lesson grows as images and video load, which changes the scrollable
    // height; recompute when it does.
    const observer = new ResizeObserver(update)
    if (contentRef.current) observer.observe(contentRef.current)

    return () => {
      clearTimeout(settle)
      diana.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [topicNumber, subtopicId, markRead, setProgress])

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-background">
      <LessonLoadingOverlay />
      <div ref={contentRef} className="flex-1">
        {children}
      </div>
    </main>
  )
}
