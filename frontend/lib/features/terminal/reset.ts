"use client"

import { resetTerminal as resetTerminalRequest } from "./settings"

/**
 * Canal del boton "Reset terminal".
 *
 * La barra de ajustes y el emulador son hermanos: la barra sabe cuando se pulsa
 * y el emulador es el unico que tiene el socket. Antes se resolvia remontando
 * el emulador con una `key` nueva, y eso obligaba a abrir otra conexion —el
 * paso que fallaba en produccion, ver `terminal-emulator.tsx`—. Ahora la orden
 * viaja por aqui hasta el socket que ya esta abierto.
 *
 * Es el mismo patron de `terminal-input.ts`, en la otra direccion.
 */
type Handler = () => Promise<void>

let handler: Handler | null = null

/**
 * El emulador se registra al montarse. Devuelve la baja, que solo tiene efecto
 * si sigue siendo el suyo: al pasar de una vista a otra el emulador nuevo se
 * registra antes de que el viejo se desmonte, y borrarlo por orden de llegada
 * dejaria el boton sin destinatario.
 */
export function registerTerminalReset(fn: Handler): () => void {
  handler = fn
  return () => {
    if (handler === fn) handler = null
  }
}

/**
 * Reinicia la terminal y resuelve cuando hay una sesion nueva.
 *
 * Sin emulador montado no hay socket por el que pedirlo, asi que queda el
 * endpoint: mata los procesos del usuario, que es la mitad util del reinicio.
 */
export async function requestTerminalReset(): Promise<void> {
  if (handler) return handler()
  await resetTerminalRequest()
}
