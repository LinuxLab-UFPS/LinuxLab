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
 *
 * Hay una cola: un comando (p. ej. el `cd` a la carpeta de trabajo al abrir una
 * actividad) puede llegar antes de que la terminal haya abierto su WebSocket.
 * Mientras no esté lista se encola, y en cuanto lo está se vacía en orden. Es el
 * mismo patrón del mensaje de resize en el gateway, del lado del navegador: sin
 * esto, la primera orden de cada sesión se perdería.
 */
type Listener = (data: string) => void

const listeners = new Set<Listener>()
const queue: string[] = []
let ready = false

/** Suscribe una terminal. Devuelve la función para darse de baja. */
export function onTerminalInput(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** La terminal está conectada: vacía la cola en el orden en que llegó. */
export function markTerminalReady(): void {
  ready = true
  const pending = queue.splice(0, queue.length)
  pending.forEach((data) => listeners.forEach((listener) => listener(data)))
}

export function sendToTerminal(data: string): void {
  if (!ready) {
    queue.push(data)
    return
  }
  listeners.forEach((listener) => listener(data))
}
