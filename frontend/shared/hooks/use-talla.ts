"use client"

import { useEffect, useState } from "react"

/**
 * Las tres tallas de la aplicacion, en un solo sitio.
 *
 * La idea es que sean fijas, como las tallas de zapato: un dispositivo se queda
 * en la suya al girarlo y no salta de una maquetacion a otra a mitad de
 * trabajo. Un iPad mide 834 en vertical y 1194 en horizontal, asi que ambos
 * giros caen en `media` y la terminal no se le cierra al usuario.
 *
 *   compacta   < 768    moviles en vertical
 *   media      768-1279 tablets en cualquier giro, movil apaisado
 *   completa   >= 1280  portatiles y escritorio
 *
 * Coinciden con `md` y `xl` de Tailwind, para que las clases y este hook
 * cuenten siempre lo mismo.
 */
export const TALLA_MEDIA = 768
export const TALLA_COMPLETA = 1280

export type Talla = "compacta" | "media" | "completa"

/**
 * Devuelve `undefined` en el servidor y hasta que monta.
 *
 * Es a proposito: adivinar una talla en el servidor pinta la maquetacion
 * equivocada y luego salta. Quien lo use debe tratar `undefined` como "todavia
 * no se sabe" y no pintar nada que dependa de ello.
 */
export function useTalla(): Talla | undefined {
  const [talla, setTalla] = useState<Talla | undefined>(undefined)

  useEffect(() => {
    const calcular = () => {
      const ancho = window.innerWidth
      setTalla(ancho >= TALLA_COMPLETA ? "completa" : ancho >= TALLA_MEDIA ? "media" : "compacta")
    }
    calcular()
    window.addEventListener("resize", calcular)
    return () => window.removeEventListener("resize", calcular)
  }, [])

  return talla
}

/**
 * Si la ventana da para la maquetacion de escritorio completa.
 *
 * Es la pregunta que se hacen la terminal y la barra de contenidos: por debajo
 * de esto no hay ancho para tres columnas.
 */
export function useEsCompleta(): boolean | undefined {
  const talla = useTalla()
  return talla === undefined ? undefined : talla === "completa"
}
