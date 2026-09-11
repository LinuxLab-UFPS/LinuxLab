"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { HOME, irA } from "@/lib/features/student/directorio-terminal"

/**
 * La shell vuelve al home en cuanto se sale de una actividad.
 *
 * La pantalla de la terminal ya lleva la shell al directorio de la actividad que
 * se abre, pero eso solo cubre lo que pasa dentro de esa pantalla. Al irse de
 * ella —a `/curso`, al catalogo, a rendimiento— el componente se desmonta y su
 * efecto no llega a correr, asi que la shell se quedaba dentro del directorio de
 * la actividad anterior. La primera comprobacion de la leccion, que se evalua
 * contra el home, fallaba sin decir por que.
 *
 * Esto vive en la raiz y solo sabe una cosa: si no estamos en la terminal, no
 * hay actividad, y el sitio es el home. La pantalla de la terminal se encarga
 * del otro caso; los dos comparten el mismo destino en
 * `directorio-terminal.ts`, asi que no se pisan.
 *
 * No abre sesion por su cuenta: quien no haya tocado la terminal no paga una
 * conexion por navegar. El comando se encola y sale con el primer prompt.
 */
export function DirectorioAutomatico() {
  const ruta = usePathname()

  useEffect(() => {
    if (ruta === "/terminal") return
    irA(HOME)
  }, [ruta])

  return null
}
