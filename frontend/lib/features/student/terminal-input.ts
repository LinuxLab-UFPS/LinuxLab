"use client"

/**
 * Canal para escribir en la terminal desde fuera de ella.
 *
 * El panel de actividad y la consola son hermanos en la rejilla: no comparten
 * estado ni tienen un ancestro que sea de los dos. Pasar una referencia por toda
 * la cadena para un mensaje puntual obligaría a tocar cuatro componentes que no
 * pintan nada en esto, así que el mensaje viaja por aquí.
 *
 * Lo que se envía es lo mismo que teclearía el estudiante, con sus caracteres de
 * control: la terminal no distingue el origen.
 */
type Listener = (data: string) => void

const listeners = new Set<Listener>()

/** Suscribe una terminal. Devuelve la función para darse de baja. */
export function onTerminalInput(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function sendToTerminal(data: string): void {
  listeners.forEach((listener) => listener(data))
}
