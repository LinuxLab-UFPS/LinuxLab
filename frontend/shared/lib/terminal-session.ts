"use client"

import { env } from "@/lib/config/env"
import { markTerminalReady } from "@/lib/features/student/terminal-input"

/**
 * La sesion de terminal, fuera de React.
 *
 * El socket vivia dentro del componente, asi que cada vez que se montaba uno
 * nuevo —cambiar de pestaña, abrir la terminal de la leccion, el boton de
 * reset— habia que abrir otra conexion. Y abrir una conexion nueva es
 * justamente lo que falla en el servidor: la peticion muere en
 * NS_ERROR_NET_RESET sin llegar a negociar, y solo recargar la pagina la
 * arregla. De ahi el «si entro desde una pestaña no carga, si recargo si».
 *
 * Aqui la conexion es una sola y no se cierra al desmontar. Un emulador que
 * aparece se engancha a lo que ya hay: repinta el historial y sigue en directo.
 * Como efecto util, la sesion sobrevive a la navegacion —lo que se estuviera
 * ejecutando sigue ahi al volver—, que antes se perdia.
 */

const WS_BASE = env.backendUrl.replace(/^http/, "ws")

/** Esperas entre reintentos cuando la conexion muere antes de abrirse. */
const ESPERAS = [500, 1200, 2500]

/**
 * Cuanto texto se guarda para repintar. Es lo que ve quien vuelve a la
 * terminal, no el scrollback entero: 200 KB son varias pantallas de sobra y
 * ponen un techo a la memoria de una sesion larga.
 */
const MAX_HISTORIAL = 200_000

type Salida = (texto: string) => void

let ws: WebSocket | null = null
let historial = ""
let abierta = false
let intento = 0
let reintento: ReturnType<typeof setTimeout> | undefined
let tamaño: { cols: number; rows: number } | null = null
const oyentes = new Set<Salida>()

/** Quien espera la confirmacion de un reinicio (ver `reiniciarSesion`). */
let espera: {
  resolve: () => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
} | null = null

function cerrarEspera(err?: Error) {
  if (!espera) return
  const { resolve, reject, timer } = espera
  espera = null
  clearTimeout(timer)
  if (err) reject(err)
  else resolve()
}

/**
 * La ruta que la shell dice ocupar, o null si todavia no lo ha dicho.
 *
 * Vive en el modulo y no en un componente a proposito: sobrevive a cambiar de
 * pagina, igual que la propia sesion. Un intento anterior de saber esto guardaba
 * en React si se habia pulsado "ir a la carpeta", y al recargar volvia a cero y
 * bloqueaba el boton a quien ya estaba en el sitio correcto.
 *
 * Null significa "no se sabe", que no es lo mismo que "esta fuera": hasta el
 * primer prompt no hay dato, y quien lo consuma no debe castigar esa espera.
 */
let cwd: string | null = null
const oyentesCwd = new Set<(ruta: string | null) => void>()

/** La secuencia con la que la shell anuncia su directorio (OSC 7). */
const OSC7 = /\x1b\]7;file:\/\/([^\x1b\x07]*)(?:\x1b\\|\x07)/g

/** El directorio actual conocido, o null si la shell aun no lo ha dicho. */
export function directorioActual(): string | null {
  return cwd
}

/** Avisa cuando la shell cambia de directorio. Devuelve la baja. */
export function alCambiarDirectorio(oyente: (ruta: string | null) => void) {
  oyentesCwd.add(oyente)
  oyente(cwd)
  return () => oyentesCwd.delete(oyente)
}

function olvidarCwd() {
  if (cwd === null) return
  cwd = null
  for (const oyente of oyentesCwd) oyente(null)
}

function leerCwd(texto: string) {
  let ultima: string | null = null
  for (const m of texto.matchAll(OSC7)) ultima = m[1]
  if (ultima === null || ultima === cwd) return
  cwd = ultima
  for (const oyente of oyentesCwd) oyente(cwd)
}

/**
 * Si hay un programa ocupando la pantalla entera, como `vi` o `top`.
 *
 * Se sabe por la pantalla alternativa: al arrancar, esos programas piden el
 * bufer de repuesto con `?1049h` y al salir lo devuelven con `?1049l`. Importa
 * porque escribir en la terminal desde fuera (el boton de "ir a la carpeta")
 * mientras `vi` esta abierto no ejecuta nada: teclea dentro del archivo, y en
 * modo normal `c`, `d` y `~` son ordenes de edicion que lo estropean.
 */
let alterna = false
const oyentesAlterna = new Set<(activa: boolean) => void>()
const PANTALLA_ALTERNA = /\x1b\[\?1049([hl])/g

export function pantallaAlterna(): boolean {
  return alterna
}

/** Avisa cuando entra o sale un programa de pantalla completa. */
export function alCambiarPantallaAlterna(oyente: (activa: boolean) => void) {
  oyentesAlterna.add(oyente)
  oyente(alterna)
  return () => {
    oyentesAlterna.delete(oyente)
  }
}

function leerPantallaAlterna(texto: string) {
  let ultima: boolean | null = null
  for (const m of texto.matchAll(PANTALLA_ALTERNA)) ultima = m[1] === "h"
  if (ultima === null || ultima === alterna) return
  alterna = ultima
  for (const oyente of oyentesAlterna) oyente(alterna)
}

function olvidarPantallaAlterna() {
  if (!alterna) return
  alterna = false
  for (const oyente of oyentesAlterna) oyente(false)
}

/**
 * Todo lo que se pinta pasa por aqui: la salida de la PTY y los avisos de
 * conexion. Asi un emulador que se monta despues los ve tambien, en su sitio.
 */
function emitir(texto: string) {
  leerCwd(texto)
  leerPantallaAlterna(texto)
  historial += texto
  if (historial.length > MAX_HISTORIAL) {
    historial = historial.slice(historial.length - MAX_HISTORIAL)
  }
  for (const oyente of oyentes) oyente(texto)
}

function conectar() {
  if (typeof window === "undefined") return
  const socket = new WebSocket(`${WS_BASE}/terminal`)
  ws = socket

  socket.onopen = () => {
    abierta = true
    intento = 0
    if (tamaño) socket.send(JSON.stringify({ type: "resize", ...tamaño }))
    // La terminal está lista: los comandos que llegaron antes (p. ej. el cd a
    // la carpeta de trabajo al abrir una actividad) se vacían en orden.
    markTerminalReady()
  }

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === "output") emitir(msg.data)
      if (msg.type === "reset-ok") cerrarEspera()
      if (msg.type === "exit") emitir(`\r\n[Process exited with code ${msg.code}]\r\n`)
    } catch {
      /* mensajes que no son JSON: no hay nada que pintar */
    }
  }

  // El error de socket no dice nada util por si mismo y siempre viene seguido
  // de un close: se informa alli, con el motivo.
  socket.onerror = () => {}

  socket.onclose = (event) => {
    cerrarEspera(new Error("La conexión se cerró durante el reinicio"))
    if (ws !== socket) return
    ws = null
    // La shell de la que veniamos ya no existe: su directorio deja de valer.
    // Vuelve a "no se sabe" y no a "esta fuera", que bloquearia por error.
    olvidarCwd()
    // Y con la sesion se fue cualquier `vi` que estuviera abierto.
    olvidarPantallaAlterna()

    // Nunca llego a abrirse y quedan intentos.
    if (!abierta && intento < ESPERAS.length) {
      const pausa = ESPERAS[intento]
      intento += 1
      if (intento > 1) emitir("\r\n\x1b[33mReconectando…\x1b[0m\r\n")
      reintento = setTimeout(conectar, pausa)
      return
    }

    if (!abierta) {
      emitir("\r\n\x1b[31mNo se pudo conectar con la terminal.\x1b[0m\r\n")
      emitir("\x1b[92mRecarga la página para volver a intentarlo.\x1b[0m\r\n")
      return
    }

    // La sesion estuvo viva y se cerro: haber salido de la pestaña, un `exit`
    // o el cierre por inactividad. El motivo lo manda el servidor.
    abierta = false
    const motivo = event.reason && event.reason.trim() ? event.reason.trim() : null
    emitir("\r\n\x1b[33mLa sesión de la terminal se cerró.\x1b[0m\r\n")
    if (motivo) emitir(`\x1b[37m${motivo}\x1b[0m\r\n`)
    emitir("\x1b[92mPulsa «Reset terminal» para abrir una nueva.\x1b[0m\r\n")
  }
}

/** Abre la conexion si no hay ninguna. Llamarlo de más no cuesta nada. */
export function asegurarSesion(): void {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
  clearTimeout(reintento)
  intento = 0
  abierta = false
  conectar()
}

/** Se engancha a la sesion en curso. Devuelve la baja. */
export function escuchar(salida: Salida): () => void {
  oyentes.add(salida)
  return () => {
    oyentes.delete(salida)
  }
}

/** Lo dicho hasta ahora, para repintarlo en una terminal recien montada. */
export function historialSesion(): string {
  return historial
}

export function enviarEntrada(data: string): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "input", data }))
  }
}

export function redimensionar(cols: number, rows: number): void {
  if (!cols || !rows) return
  tamaño = { cols, rows }
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "resize", cols, rows }))
  }
}

/**
 * "Reset terminal": se pide por el socket abierto y el servidor mata los
 * procesos y abre una PTY nueva sin tocar la conexion. Solo se reconecta si no
 * hay socket vivo, que es cuando de verdad hace falta uno.
 *
 * El `reinicioHttp` es el mismo endpoint de siempre, que aqui solo cubre ese
 * caso: sin socket no hay a quien pedirselo, pero los procesos hay que
 * matarlos igual.
 */
export async function reiniciarSesion(reinicioHttp: () => Promise<void>): Promise<void> {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    await reinicioHttp()
    historial = ""
    asegurarSesion()
    return
  }

  historial = ""
  olvidarCwd()
  olvidarPantallaAlterna()
  for (const oyente of oyentes) oyente("\x1bc")
  emitir("\x1b[90mReiniciando la terminal…\x1b[0m\r\n")
  ws.send(JSON.stringify({ type: "reset" }))

  await new Promise<void>((resolve, reject) => {
    cerrarEspera(new Error("Reinicio reemplazado por otro"))
    // Matar los procesos del usuario tarda —el servidor espera a que no quede
    // ninguno antes de abrir la sesion nueva—, pero no medio minuto.
    const timer = setTimeout(() => {
      cerrarEspera(new Error("La terminal no respondió al reinicio"))
    }, 30000)
    espera = { resolve, reject, timer }
  })
}

/** Cierra la sesion a proposito (cerrar sesion en la plataforma). */
export function terminarSesion(): void {
  clearTimeout(reintento)
  cerrarEspera(new Error("La terminal se cerró"))
  historial = ""
  abierta = false
  const socket = ws
  ws = null
  socket?.close()
}
