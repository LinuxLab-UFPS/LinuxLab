import { escribirAviso } from "@shared/lib/terminal-session"

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
const BLANCO = "\x1b[97m"
const NEGRITA = "\x1b[1m"
const FIN = "\x1b[0m"

/** Qué se está resolviendo, para nombrarlo por su nombre en el veredicto. */
export type TipoDeReto = "actividad" | "comprobacion"

/**
 * El enunciado, al abrir una comprobación.
 *
 * El título va en el ámbar de la marca y el enunciado en blanco. En gris tenue
 * —como estaba— se perdía contra el fondo justo cuando es lo único que hay que
 * leer.
 */
export function avisarEnunciado(titulo: string, enunciado: string) {
  escribirAviso(`\r\n${AMBAR}${titulo}${FIN}\r\n${BLANCO}${enunciado}${FIN}\r\n\r\n`)
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
  escribirAviso(
    `\r\n${NEGRITA}${color}${texto}${FIN} ${BLANCO}(${puntaje}/${total} pts)${FIN}\r\n\r\n`,
  )
}
