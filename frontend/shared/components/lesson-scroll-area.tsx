"use client"

import { useEffect, useRef } from "react"
import { useLessonProgress } from "@/lib/features/student/progress"
import { useSetReadingProgress } from "@shared/components/reading-progress"

/** Below this the lesson counts as read. Reaching an exact 100% is fiddly. */
const READ_AT = 95

/**
 * Mide el avance de lectura de la leccion.
 *
 * Ya no es un contenedor con scroll propio: el de la pagina es el de la ventana,
 * asi que la rueda funciona en cualquier parte y no solo sobre esta columna.
 * Lo que queda aqui es la medida — informar a la barra de progreso de debajo de
 * la cabecera y marcar la leccion leida al llegar al final.
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
    // Este componente se remonta al cambiar de leccion (la `key` de ContentArea),
    // y con el scroll en la ventana eso ya no reinicia la posicion solo: si no,
    // la leccion nueva se abriria por donde se quedo la anterior.
    window.scrollTo(0, 0)

    const doc = document.documentElement
    let settle: ReturnType<typeof setTimeout> | undefined

    const update = () => {
      const max = doc.scrollHeight - doc.clientHeight

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

      const value = Math.min(100, Math.round((window.scrollY / max) * 100))
      setProgress(value)
      if (value >= READ_AT && subtopicId) markRead(topicNumber, subtopicId)
    }

    update()
    window.addEventListener("scroll", update, { passive: true })

    // The lesson grows as images and video load, which changes the scrollable
    // height; recompute when it does.
    const observer = new ResizeObserver(update)
    if (contentRef.current) observer.observe(contentRef.current)

    return () => {
      clearTimeout(settle)
      window.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [topicNumber, subtopicId, markRead, setProgress])

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-background">
      <div ref={contentRef} className="flex-1">
        {children}
      </div>
    </main>
  )
}
