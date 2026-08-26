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

    // `scrollerDe` puede devolver null si cambia la disposicion del shell.
    // `root: null` es el viewport del documento, que es la caida correcta.
    const raiz = scrollerDe(nodo)
    const desplazable: HTMLElement | Window = raiz ?? window

    let limpiar = () => {}
    const revelar = () => {
      setVisible(true)
      limpiar()
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) revelar()
        }
      },
      { root: raiz, threshold: visibilidad },
    )

    /**
     * El respaldo para los saltos de scroll.
     *
     * Un salto —la tecla Fin, un ancla, arrastrar la barra— puede llevarse el
     * bloque de debajo de la pantalla a encima sin que llegue a cruzarla. La
     * proporcion visible se queda en cero todo el rato, asi que para el
     * observador no hubo NINGUN cambio y no llama a nadie: el bloque se quedaba
     * invisible para siempre. Aqui se mira la posicion a mano, que es lo unico
     * que distingue «todavia no ha llegado» de «ya se paso de largo».
     */
    const yaLlego = () => {
      const caja = nodo.getBoundingClientRect()
      const limite = raiz ? raiz.getBoundingClientRect().bottom : window.innerHeight
      return caja.top < limite
    }
    const alDesplazar = () => {
      if (yaLlego()) revelar()
    }

    limpiar = () => {
      observador.disconnect()
      desplazable.removeEventListener("scroll", alDesplazar)
    }

    observador.observe(nodo)
    desplazable.addEventListener("scroll", alDesplazar, { passive: true })

    return () => limpiar()
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
