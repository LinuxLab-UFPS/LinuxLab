import { escribirAviso, limpiarPantalla } from "@shared/lib/terminal-session"
import { sendToTerminal } from "@shared/lib/terminal-session"

/**
 * Los avisos de la plataforma dentro de la terminal.
 *
 * Se pintan en la pantalla pero no se envían a la shell: son texto, no comandos.
 * La razón de escribirlos aquí y no solo en el panel es que el estudiante mira la
 * terminal mientras trabaja, y el veredicto le llegaba fuera de su campo de
 * visión.
 *
 * Del intento queda una sola línea. Antes iba también una por aserción y la
 * terminal quedaba sepultada bajo el informe entero después de cada intento; el
 * detalle vive en el panel, que es donde se lee con calma.
 */

const AMBAR = "\x1b[1;38;2;245;158;11m"
const BLANCO = "\x1b[97m"
const VERDE = "\x1b[32m"
const ROJO = "\x1b[31m"
const NEGRITA = "\x1b[1m"
const FIN = "\x1b[0m"


/** Qué se está resolviendo, para nombrarlo por su nombre en el veredicto. */
export type TipoDeReto = "actividad" | "comprobacion"

/**
 * Devuelve el prompt a la línea siguiente.
 *
 * El aviso se pinta en la pantalla de xterm sin pasar por el socket, así que la
 * shell no se entera de nada: sigue creyendo que su prompt está donde lo dejó y
 * el estudiante tenía que pulsar Enter para recuperarlo. Un comando vacío la
 * obliga a dibujarlo de nuevo debajo del aviso.
 *
 * El `\x15` (Ctrl+U) delante es por lo mismo que en el reinicio de archivos: si
 * había algo escrito a medias, un Enter suelto lo ejecutaría.
 */
function devolverPrompt() {
  sendToTerminal("\x15\n")
}

/**
 * El enunciado, al abrir una comprobación.
 *
 * La pantalla se limpia antes. Lo que hay que hacer es lo único que importa en
 * ese momento, y al final de la salida de veinte comandos anteriores no se
 * encontraba.
 *
 * El rótulo en el ámbar de la marca y el enunciado en blanco: el ámbar señala de
 * dónde viene el mensaje (la plataforma, no la shell) y el blanco es el texto
 * que hay que leer.
 */
export function avisarEnunciado(titulo: string, enunciado: string) {
  limpiarPantalla()
  escribirAviso(`\r\n${AMBAR}${titulo}:${FIN} ${BLANCO}${enunciado}${FIN}\r\n\r\n`)
  devolverPrompt()
}

/** El veredicto del intento. */
export function avisarResultado(
  tipo: TipoDeReto,
  aprobada: boolean,
  puntaje: number,
  total: number,
) {
  const color = aprobada ? VERDE : ROJO
  const nombre = tipo === "comprobacion" ? "Comprobación" : "Actividad"
  const texto = `${nombre} ${aprobada ? "aprobada" : "no aprobada"}`
  escribirAviso(`\r\n${NEGRITA}${color}${texto} (${puntaje}/${total} pts)${FIN}\r\n\r\n`)
  devolverPrompt()
}
