"use client"

import { useSyncExternalStore } from "react"
import { sendToTerminal, directorioActual } from "@shared/lib/terminal-session"

/**
 * A donde tiene que estar mirando la shell, segun la pantalla que se ve.
 *
 * El estado vive en el modulo y no en un componente porque la sesion de
 * terminal tampoco esta en React: sobrevive a cambiar de pagina, asi que quien
 * la dirige tiene que sobrevivir igual. Si el destino viviera en un `useRef` de
 * la pantalla de la terminal, salir de ella a `/curso` lo reiniciaria y la shell
 * se quedaria en el directorio de la actividad anterior; que es justo lo que
 * pasaba, y por lo que la primera comprobacion del tema fallaba sin decir nada.
 *
 * Hay dos quien llaman a `irA`: la pantalla de la terminal, que sabe que
 * actividad hay abierta, y el vigilante de la raiz, que solo sabe que no
 * estamos en una y manda al home.
 */

export const HOME = "~"

/* Arranca en el home porque es donde arranca la shell. Asi una carga directa sin
   actividad no escribe un `cd ~` que no hace nada. */
let ultimoDestino: string = HOME

/* El directorio al que se va, mientras se va.
 *
 * Existe para que el panel de la actividad pueda esperar. Entre que llegan sus
 * datos y aterriza el `cd` hay unos milisegundos en los que la shell aun esta en
 * el home, y el aviso de "no estas en el directorio" se pintaba y se iba: un
 * parpadeo rojo cada vez que se abria una actividad. */
let ubicandoEn: string | null = null
const oyentes = new Set<() => void>()

/** Cuanto se espera al `cd` antes de dar por hecho que no llego. */
const ESPERA_MAXIMA = 5000
let plazo: ReturnType<typeof setTimeout> | null = null

function anunciar() {
  for (const oyente of oyentes) oyente()
}

function fijarUbicando(workdir: string | null) {
  if (plazo !== null) {
    clearTimeout(plazo)
    plazo = null
  }
  if (ubicandoEn === workdir) return
  ubicandoEn = workdir
  anunciar()
  if (workdir === null) return
  /* Si el comando se perdiera, lo que tiene que salir es el aviso que explica
     que hacer, no un spinner que no termina nunca. */
  plazo = setTimeout(() => {
    plazo = null
    ubicandoEn = null
    anunciar()
  }, ESPERA_MAXIMA)
}

/** La shell ya llego (o el estudiante llego por su cuenta). */
export function confirmarDirectorio(workdir: string | null | undefined) {
  if (ubicandoEn === null) return
  if (workdir !== undefined && workdir !== ubicandoEn) return
  fijarUbicando(null)
}

/**
 * Lleva la shell donde toca, si no esta ya de camino.
 *
 * `null` es "todavia no se sabe", que no es lo mismo que el home: sin esa
 * distincion, abrir una actividad mandaba primero un `cd ~` y despues el de la
 * actividad, y la consola aparecia con dos ordenes que nadie escribio.
 */
export function irA(destino: string | null, workdir: string | null = null) {
  if (destino === null) return
  if (ultimoDestino === destino) return
  ultimoDestino = destino
  /* Ctrl+U primero: si habia algo escrito a medias, un Enter suelto lo
     ejecutaria. Y `mkdir -p` antes del `cd` porque el directorio solo lo monta
     `setup.py` cuando la actividad trae archivos de partida; sin el, el `cd`
     fallaba en silencio y el estudiante se quedaba en su home creyendo que ya
     estaba dentro. */
  sendToTerminal(
    destino === HOME ? "\x15cd ~\n" : `\x15mkdir -p ${destino} && cd ${destino}\n`,
  )
  fijarUbicando(workdir)
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

/** El directorio al que se esta yendo la shell, o `null` si ya llego. */
export function useUbicandoDirectorio(): string | null {
  return useSyncExternalStore(
    suscribir,
    () => ubicandoEn,
    () => null,
  )
}

/** Por si hace falta saber donde esta parada sin suscribirse. */
export { directorioActual }
