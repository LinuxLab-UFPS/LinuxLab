import { escribirAviso } from "@shared/lib/terminal-session"

/**
 * El resultado de una comprobación, escrito en la terminal.
 *
 * Se pinta en la pantalla pero no se envía a la shell: es texto, no un comando.
 * La razón de escribirlo aquí y no solo en el panel es que el estudiante mira la
 * terminal mientras trabaja, y el veredicto le llegaba fuera de su campo de
 * visión.
 *
 * Una sola línea, la del resultado. Antes iba también una por asersión y la
 * terminal quedaba sepultada bajo el informe entero después de cada intento; el
 * detalle vive ahora en el panel, que es donde se lee con calma.
 */

const VERDE = "\x1b[32m"
const ROJO = "\x1b[31m"
const GRIS = "\x1b[90m"
const NEGRITA = "\x1b[1m"
const FIN = "\x1b[0m"

/** El veredicto del intento. */
export function avisarResultado(aprobada: boolean, puntaje: number, total: number) {
  const color = aprobada ? VERDE : ROJO
  const texto = aprobada ? "Actividad aprobada" : "Actividad no aprobada"
  escribirAviso(
    `\r\n${NEGRITA}${color}${texto}${FIN} ${GRIS}(${puntaje}/${total} pts)${FIN}\r\n\r\n`,
  )
}
