"use client"

import { useEffect, useState } from "react"
import {
  alCambiarDirectorio,
  alCambiarPantallaAlterna,
  directorioActual,
  pantallaAlterna,
} from "@shared/lib/terminal-session"

/**
 * Donde esta parada la shell del estudiante, segun ella misma.
 *
 * El dato lo emite el prompt (ver `entorno/scripts/linuxlab-shell.sh`) y lo
 * guarda la sesion de terminal, fuera de React, asi que sobrevive a cambiar de
 * pagina. `null` es "todavia no lo ha dicho", que no es lo mismo que "esta
 * fuera".
 */
export function useCwd(): string | null {
  const [ruta, setRuta] = useState<string | null>(() => directorioActual())
  useEffect(() => {
    const baja = alCambiarDirectorio(setRuta)
    return () => {
      baja()
    }
  }, [])
  return ruta
}

/**
 * Si hay un programa de pantalla completa abierto, como `vi` o `top`.
 *
 * Mientras lo haya no se le puede escribir a la terminal desde fuera: lo que se
 * mande no se ejecuta, se teclea dentro del programa.
 */
export function useProgramaAPantallaCompleta(): boolean {
  const [activa, setActiva] = useState<boolean>(() => pantallaAlterna())
  useEffect(() => {
    const baja = alCambiarPantallaAlterna(setActiva)
    return () => {
      baja()
    }
  }, [])
  return activa
}

/**
 * Si el estudiante esta parado en la carpeta de la actividad (o dentro de ella,
 * porque trabajar en una subcarpeta sigue siendo estar en la actividad).
 *
 * Devuelve `true` mientras no se sepa la ruta: hasta el primer prompt no hay
 * dato, y bloquear en esa espera es exactamente el falso negativo que hay que
 * evitar. Tambien `true` cuando la actividad no declara carpeta, como
 * `universidad-facultades`, que monta su arbol en el home a proposito.
 */
export function useEnLaCarpeta(workdir: string | null | undefined): boolean {
  const ruta = useCwd()
  if (!workdir) return true
  if (ruta === null) return true
  return ruta === `/${workdir}` || ruta.endsWith(`/actividades/${workdir}`) ||
    ruta.includes(`/actividades/${workdir}/`)
}
