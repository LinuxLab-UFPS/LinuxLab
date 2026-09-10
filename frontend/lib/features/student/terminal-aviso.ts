import { escribirAviso } from "@shared/lib/terminal-session"
import { sendToTerminal } from "@/lib/features/student/terminal-input"

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
const VERDE = "\x1b[32m"
const ROJO = "\x1b[31m"
const NEGRITA = "\x1b[1m"
const FIN = "\x1b[0m"

/* Borra la linea donde esta el cursor y vuelve al principio.
 *
 * El aviso se pinta donde quedo el cursor, que es justo despues del prompt, asi
 * que sin esto salia pegado a el y parecia un comando que el estudiante hubiera
 * escrito. Se borra ese prompt, se escribe el aviso en su sitio y la shell pinta
 * uno nuevo debajo. */
const LIMPIAR_LINEA = "\x1b[2K\r"

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
 * Todo en el ámbar de la marca y en una sola línea. Iba el título arriba y el
 * enunciado debajo en blanco, separados por líneas en blanco: tres renglones
 * para lo que es una frase, y el blanco lo hacía indistinguible de la salida de
 * cualquier comando.
 */
export function avisarEnunciado(titulo: string, enunciado: string) {
  escribirAviso(`${LIMPIAR_LINEA}${AMBAR}${titulo}: ${enunciado}${FIN}\r\n`)
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
  escribirAviso(`${LIMPIAR_LINEA}${NEGRITA}${color}${texto} (${puntaje}/${total} pts)${FIN}\r\n`)
  devolverPrompt()
}
