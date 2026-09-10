"use client"

import { env } from "@/lib/config/env"

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
 *
 * El recorte no se hace al pasarse de MAX sino al pasarse de TOPE, y entonces
 * baja hasta MAX. La diferencia importa: antes se recortaba en cuanto se
 * superaban los 200 KB, o sea en CADA trozo que llegaba a partir de ahi, y cada
 * trozo es una tecla del eco. Escribir reservaba y copiaba 200 KB por pulsacion
 * y la terminal se iba volviendo lenta segun avanzaba la sesion. Con la holgura
 * se recorta una vez cada 100 KB.
 */
const MAX_HISTORIAL = 200_000
const TOPE_HISTORIAL = 300_000

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
 * en React si se habia pulsado "ir al directorio", y al recargar volvia a cero y
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
  if (ultima === null) return
  /* El prompt es la unica prueba de que hay una shell escuchando: lo emite ella
     misma (OSC 7, ver `linuxlab-shell.sh`). Aqui se vacia la cola de comandos
     que llegaron antes, y no al abrir el socket, que es un segundo antes de que
     exista la PTY. */
  vaciarCola()
  if (ultima === cwd) return
  cwd = ultima
  for (const oyente of oyentesCwd) oyente(cwd)
}

/**
 * Si hay un programa ocupando la pantalla entera, como `vi` o `top`.
 *
 * Se sabe por la pantalla alternativa: al arrancar, esos programas piden el
 * bufer de repuesto con `?1049h` y al salir lo devuelven con `?1049l`. Importa
 * porque escribir en la terminal desde fuera (el boton de "ir al directorio")
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
  /* Las dos lecturas escanean con expresiones regulares, y esto corre por cada
     trozo que llega, incluido el eco de cada tecla. Un ESC es condicion
     necesaria para las dos secuencias que buscan, asi que una tecla normal se
     va por aqui sin pagar los dos escaneos. */
  if (texto.includes("\x1b")) {
    leerCwd(texto)
    leerPantallaAlterna(texto)
  }
  historial += texto
  if (historial.length > TOPE_HISTORIAL) {
    historial = historial.slice(historial.length - MAX_HISTORIAL)
  }
  for (const oyente of oyentes) oyente(texto)
}

/**
 * Escribe un aviso de la plataforma en la pantalla de la terminal.
 *
 * Va por `emitir` para que entre en el historial y lo vea un emulador que se
 * monte despues, pero NO se envia a la shell: es texto, no un comando. Los
 * detectores de `emitir` (cwd y pantalla alterna) leen secuencias OSC que un
 * aviso nuestro no contiene, asi que pintarlo no altera ese estado.
 */
export function escribirAviso(texto: string): void {
  emitir(texto)
}

/**
 * Deja la pantalla en blanco, sin pasar por la shell.
 *
 * Se usa al abrir una comprobacion: el enunciado se lee mejor en una pantalla
 * limpia que al final de lo que hubiera antes. Mandarle `clear` a bash no vale
 * aqui, porque ese comando da la vuelta por el contenedor y volveria DESPUES
 * del aviso, borrandolo. Esto es local y ordenado: se limpia y se escribe.
 *
 * Borra tambien el historial, que si no un emulador que se monte despues
 * repintaria la pantalla vieja encima de la limpia. `2J` vacia lo visible, `3J`
 * el desplazamiento hacia atras y `H` devuelve el cursor arriba del todo.
 */
export function limpiarPantalla(): void {
  historial = ""
  emitir("\x1b[2J\x1b[3J\x1b[H")
}

function conectar() {
  if (typeof window === "undefined") return
  const socket = new WebSocket(`${WS_BASE}/terminal`)
  ws = socket

  socket.onopen = () => {
    abierta = true
    intento = 0
    if (tamaño) socket.send(JSON.stringify({ type: "resize", ...tamaño }))
    // Ojo: aqui NO se vacia la cola. El socket abierto no quiere decir que haya
    // shell, y lo que se escriba antes del primer prompt se pierde. Se hace en
    // `leerCwd`, cuando la shell habla.
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
    // Lo tecleado que no llego a salir era para esa shell, no para la siguiente.
    olvidarEntrada()
    // Y lo que se mande desde fuera vuelve a la cola hasta el proximo prompt.
    hayShell = false

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

/**
 * Lo tecleado que aun no ha salido, y el temporizador que lo sacara.
 *
 * El gateway corta la sesion a los 30 mensajes por segundo, y antes se mandaba
 * uno por pulsacion: dejar pulsada una tecla basta para tirar la terminal,
 * porque el autorepeat del sistema va a 30-40 por segundo. Arreglar un error
 * dejando pulsado el borrado era justo ese caso.
 *
 * Se junta lo tecleado en ventanas de 50ms, con lo que salen como mucho 20
 * mensajes por segundo, holgado por debajo del limite. Y 50ms no se notan al
 * escribir: el eco tarda mas en volver del contenedor que eso.
 *
 * Agrupar por frame (`requestAnimationFrame`) no vale: a 60fps el techo son 60
 * mensajes por segundo, el doble del limite.
 */
const MS_AGRUPADO = 50
let porEnviar = ""
let temporizadorEnvio: ReturnType<typeof setTimeout> | null = null

function vaciarEntrada(): void {
  temporizadorEnvio = null
  if (!porEnviar) return
  const data = porEnviar
  porEnviar = ""
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "input", data }))
  }
  /* La ventana se vuelve a abrir tras enviar, no al llegar la tecla siguiente:
     si se reiniciara con cada pulsacion, el autorepeat —que llega mas rapido de
     lo que dura la ventana— la estaria reabriendo siempre y saldria un mensaje
     por tecla, que es justo lo que se queria evitar. */
  temporizadorEnvio = setTimeout(vaciarEntrada, MS_AGRUPADO)
}

export function enviarEntrada(data: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  porEnviar += data
  // Sin ventana abierta, la tecla sale ya: escribir suelto no arrastra retraso.
  // Con una abierta, se acumula y sale cuando venza.
  if (temporizadorEnvio === null) vaciarEntrada()
}

/* ── Lo que manda la plataforma, no el estudiante ──────────────────────────
 *
 * El panel de la actividad tiene que poder llevar la shell a su directorio, y
 * el reinicio de archivos tiene que sacarla de un directorio que acaba de
 * borrar. Ni uno ni otro comparten ancestro util con la consola, asi que el
 * comando viaja por aqui. Lo que se envia es lo mismo que teclearia el
 * estudiante, con sus caracteres de control: la PTY no distingue el origen.
 *
 * Vivia en `terminal-input.ts` y repartia a los emuladores montados, lo que
 * tenia un agujero: en movil la consola es un modal, y con el modal cerrado no
 * hay ninguno montado. El comando recorria un conjunto vacio y se perdia sin
 * dejar rastro. Aqui escribe al socket, que existe montada o no la pantalla.
 *
 * Y encola hasta el PRIMER PROMPT, no hasta que abre el socket: el socket abre
 * en cuanto el servidor acepta, pero la PTY tarda otro segundo en existir, y lo
 * que se escriba en ese hueco no lo lee nadie.
 */
let hayShell = false
const cola: string[] = []

function vaciarCola(): void {
  if (hayShell) return
  hayShell = true
  const pendientes = cola.splice(0, cola.length)
  for (const dato of pendientes) enviarEntrada(dato)
}

export function sendToTerminal(data: string): void {
  if (!hayShell) {
    cola.push(data)
    return
  }
  enviarEntrada(data)
}

/** Lo que estuviera esperando deja de tener sentido: es de otra sesion. */
function olvidarEntrada(): void {
  porEnviar = ""
  if (temporizadorEnvio !== null) {
    clearTimeout(temporizadorEnvio)
    temporizadorEnvio = null
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
