"use client"

import { resetTerminal as resetTerminalRequest } from "./settings"
import { reiniciarSesion } from "@shared/lib/terminal-session"

/**
 * El boton "Reset terminal".
 *
 * Antes remontaba el emulador con una `key` nueva, lo que obligaba a abrir otra
 * conexion —el paso que fallaba en produccion—. Ahora la orden va por el socket
 * abierto: el servidor mata los procesos del usuario y abre una PTY nueva sin
 * tocar la conexion. El endpoint HTTP sigue ahi para el caso en que no haya
 * socket vivo, que es cuando de verdad hace falta uno nuevo.
 */
export async function requestTerminalReset(): Promise<void> {
  await reiniciarSesion(resetTerminalRequest)
}
