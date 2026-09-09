"use client"

import { useEffect, useRef } from "react"
import { useLessonProgress } from "@/lib/features/student/progress"
import { useSetReadingProgress } from "@shared/components/reading-progress"
import { LessonLoadingOverlay } from "@shared/components/lesson-loading"
import { useTerminalUI } from "@shared/components/terminal-ui"
import { scrollerDe } from "@shared/lib/scroller"

/** Below this the lesson counts as read. Reaching an exact 100% is fiddly. */
const READ_AT = 95

/** Lo que dura la transición de ancho de `GroupBody`, más un margen. */
const REACOMODO_MS = 400

/**
 * Mide el avance de lectura de la leccion, y la sujeta cuando la pagina se
 * reacomoda.
 *
 * No es un contenedor con scroll propio: scrollea un ancestro —el `<main>` de la
 * pagina del curso— o la ventana, asi que la rueda funciona en cualquier parte y
 * no solo sobre esta columna. Lo que queda aqui es la medida: informar a la
 * barra de progreso de debajo de la cabecera y marcar la leccion leida al
 * llegar al final.
 *
 * Y el ancla. Al abrir la terminal cambian tres cosas a la vez —la fila se
 * ensancha, entra la columna de la consola y el texto baja de escala—, y aunque
 * el `scrollTop` no se toca, deja de apuntar al mismo parrafo: el lector abria
 * la consola y aparecia en otro sitio. Se guarda que parrafo estaba arriba y se
 * corrige en cada fotograma mientras dura el reacomodo.
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
  const { open } = useTerminalUI()

  /** El parrafo que estaba arriba del todo, y a que altura. */
  const anclaRef = useRef<{ el: Element; top: number } | null>(null)
  /** Mientras se reacomoda no se marca leido: ver `update`. */
  const reacomodandoRef = useRef(false)

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

    /* Cual es el primer bloque visible. Se guarda en cada scroll porque hay que
       tenerlo ANTES de que el ancho cambie: cuando React ya ha aplicado las
       clases nuevas, medir la posicion vieja es imposible. */
    const anclar = () => {
      const marco = scroller ? scroller.getBoundingClientRect().top : 0
      const bloques = contentRef.current?.querySelectorAll(":scope > * > *") ?? []
      for (const el of bloques) {
        const { top, bottom } = el.getBoundingClientRect()
        if (bottom > marco) {
          anclaRef.current = { el, top }
          return
        }
      }
      anclaRef.current = null
    }

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
        if (subtopicId && !reacomodandoRef.current) {
          settle = setTimeout(() => markRead(topicNumber, subtopicId), 1200)
        }
        return
      }

      const value = Math.min(100, Math.round((arriba / max) * 100))
      setProgress(value)
      /* Durante el reacomodo la altura es intermedia y el porcentaje da saltos:
         puede cruzar el umbral solo y dar por leida una leccion que nadie ha
         terminado de leer. */
      if (value >= READ_AT && subtopicId && !reacomodandoRef.current) {
        markRead(topicNumber, subtopicId)
      }
    }

    const alScrollear = () => {
      if (!reacomodandoRef.current) anclar()
      update()
    }

    anclar()
    update()
    diana.addEventListener("scroll", alScrollear, { passive: true })

    // The lesson grows as images and video load, which changes the scrollable
    // height; recompute when it does.
    const observer = new ResizeObserver(update)
    if (contentRef.current) observer.observe(contentRef.current)

    return () => {
      clearTimeout(settle)
      diana.removeEventListener("scroll", alScrollear)
      observer.disconnect()
    }
  }, [topicNumber, subtopicId, markRead, setProgress])

  /* La correccion, mientras la terminal entra o sale. No basta con un ajuste al
     final: el ancho se anima durante 300 ms y la altura cambia en cada
     fotograma, asi que se persigue hasta que para. */
  useEffect(() => {
    const ancla = anclaRef.current
    const scroller = scrollerDe(contentRef.current)
    if (!ancla || !scroller || !ancla.el.isConnected) return

    reacomodandoRef.current = true
    const hasta = performance.now() + REACOMODO_MS
    let frame = 0

    const seguir = () => {
      const desvio = ancla.el.getBoundingClientRect().top - ancla.top
      if (Math.abs(desvio) > 0.5) scroller.scrollTop += desvio
      if (performance.now() < hasta) {
        frame = requestAnimationFrame(seguir)
      } else {
        reacomodandoRef.current = false
      }
    }
    frame = requestAnimationFrame(seguir)

    return () => {
      cancelAnimationFrame(frame)
      reacomodandoRef.current = false
    }
  }, [open])

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-background">
      <LessonLoadingOverlay />
      <div ref={contentRef} className="flex-1">
        {children}
      </div>
    </main>
  )
}
