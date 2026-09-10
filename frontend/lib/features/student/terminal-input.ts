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
 * Hay una cola: un comando (p. ej. el `cd` al directorio de trabajo al abrir una
 * actividad) puede llegar antes de que haya shell al otro lado. Mientras no la
 * haya se encola, y en cuanto la hay se vacía en orden. Es el mismo patrón del
 * mensaje de resize en el gateway, del lado del navegador: sin esto, la primera
 * orden de cada sesión se perdería.
 *
 * "Lista" es el primer prompt, no el socket abierto. Esa era la diferencia entre
 * que el `cd` automático funcionara o no: el socket abre en cuanto el servidor
 * acepta, pero la PTY tarda otro segundo en existir, y lo que se escribe en ese
 * hueco no lo lee nadie. Se vaciaba la cola contra una shell que aún no estaba y
 * el comando se perdía sin dejar rastro.
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

/** Hay shell y está en su prompt: vacía la cola en el orden en que llegó. */
export function markTerminalReady(): void {
  if (ready) return
  ready = true
  const pending = queue.splice(0, queue.length)
  pending.forEach((data) => listeners.forEach((listener) => listener(data)))
}

/**
 * La shell de la que veníamos ya no está.
 *
 * Al reconectar hay otra vez un hueco entre el socket y el primer prompt, así
 * que lo que llegue mientras tanto vuelve a la cola en vez de escribirse contra
 * una terminal que no lo lee.
 */
export function markTerminalNotReady(): void {
  ready = false
}

export function sendToTerminal(data: string): void {
  if (!ready) {
    queue.push(data)
    return
  }
  listeners.forEach((listener) => listener(data))
}
