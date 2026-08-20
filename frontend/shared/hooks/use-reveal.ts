"use client"

import { useEffect, useRef, useState } from "react"
import { scrollerDe } from "@shared/lib/scroller"

/**
 * Revela un bloque cuando entra en pantalla, una sola vez.
 *
 * El `root` no se deja por defecto a proposito. En el area de estudiante quien
 * hace scroll no es la ventana sino el `<main>` del shell, asi que un
 * observador con el viewport del documento dispararia a destiempo. Se resuelve
 * con `scrollerDe`, la misma busqueda de ancestro que usa la barra de progreso
 * de lectura.
 *
 * Devuelve `true` de entrada si el sistema pide menos movimiento: en ese caso
 * no hay animacion que revelar y el contenido tiene que estar puesto desde el
 * primer fotograma.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  /** Cuanto del bloque tiene que verse para disparar. */
  visibilidad = 0.25,
) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return

    // Con movimiento reducido no se anima nada: se muestra y se acaba.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true)
      return
    }

    // Si el navegador no lo soporta, mejor enseñar el contenido que esconderlo.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue
          setVisible(true)
          // Una sola vez: al volver a subir no se repite.
          observador.disconnect()
        }
      },
      // `scrollerDe` puede devolver null si cambia la disposicion del shell.
      // `root: null` es el viewport del documento, que es la caida correcta.
      { root: scrollerDe(nodo), threshold: visibilidad },
    )

    observador.observe(nodo)
    return () => observador.disconnect()
  }, [visibilidad])

  return { ref, visible }
}

/**
 * Las clases del revelado.
 *
 * Se dejan aqui para que los cuatro paneles del bloque compartan la misma
 * curva y la misma distancia, en vez de que cada uno invente la suya.
 */
export function claseRevelado(visible: boolean, retraso = 0) {
  return [
    "transition-all duration-700 ease-out motion-reduce:transition-none",
    visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
    retraso ? `[transition-delay:${retraso}ms]` : "",
  ]
    .filter(Boolean)
    .join(" ")
}
