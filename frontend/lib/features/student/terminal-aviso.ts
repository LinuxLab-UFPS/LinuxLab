import { escribirAviso } from "@shared/lib/terminal-session"

/**
 * Avisos de la plataforma dentro de la terminal.
 *
 * Se pintan en la pantalla pero no se envian a la shell: son texto, no
 * comandos. La razon de escribirlos aqui y no solo en el panel es que el
 * estudiante mira la terminal mientras trabaja, y el resultado de cada
 * comprobacion le llegaba solo abajo, fuera de su campo de vision.
 *
 * Se marcan con "::" al inicio para que se distingan de la salida real del
 * sistema: nada de lo que imprime bash empieza asi.
 */

const VERDE = "\x1b[32m"
const ROJO = "\x1b[31m"
const GRIS = "\x1b[90m"
const NEGRITA = "\x1b[1m"
const FIN = "\x1b[0m"

const marca = (color: string) => `${color}::${FIN} `

/** Una linea por asercion, numerada igual que en el panel. */
export function avisarAsercion(numero: number, descripcion: string, aprobada: boolean) {
  const color = aprobada ? VERDE : ROJO
  const simbolo = aprobada ? "✓" : "✗"
  escribirAviso(`${marca(color)}${color}${simbolo}${FIN} ${numero}. ${descripcion}\r\n`)
}

/** El resultado del intento, tras las lineas de cada asercion. */
export function avisarResultado(aprobada: boolean, puntaje: number, total: number) {
  const color = aprobada ? VERDE : ROJO
  const texto = aprobada ? "Actividad aprobada" : "Actividad no aprobada"
  escribirAviso(
    `${marca(color)}${NEGRITA}${color}${texto}${FIN} ${GRIS}(${puntaje}/${total} pts)${FIN}\r\n\r\n`,
  )
}

/** Cabecera para separar un intento del anterior. */
export function avisarComprobando() {
  escribirAviso(`\r\n${marca(GRIS)}${GRIS}Comprobando la actividad…${FIN}\r\n`)
}
