/**
 * Blocks of text a lesson hands to the student without showing them.
 *
 * The point is that the student moves something he did not type: copy it, get
 * it into a file, and prove it arrived intact. Showing it would let him retype
 * it by hand, which is a different exercise.
 *
 * OJO: si cambias un snippet que tenga comprobación, hay que resembrar la
 * actividad — el patrón que revisa el laboratorio vive en su semilla.
 */
export interface Snippet {
  id: string
  /** What the button says it will send, without revealing it. */
  label: string
  /**
   * Lo que se escribe en la terminal, entero y listo para ejecutarse.
   *
   * No es solo el bloque de texto: es el comando que lo deja donde tiene que
   * quedar. Antes era el texto pelado y el enunciado mandaba abrir `cat >
   * archivo` primero; quien pulsaba el boton antes de eso mandaba ocho lineas de
   * emoji a bash, que las tomaba por ordenes. El orden dejo de importar.
   */
  content: string
}

/** UFPS calado en blanco sobre rojo, con marco. Las filas 2, 4 y 6 son las que
 *  revisa la comprobación (ver seed-comprobacion-logo.js). */
const LOGO_UFPS = [
  "🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥",
  "🟥⬜🟥⬜🟥⬜⬜⬜🟥⬜⬜⬜🟥⬜⬜⬜🟥",
  "🟥⬜🟥⬜🟥⬜🟥🟥🟥⬜🟥⬜🟥⬜🟥🟥🟥",
  "🟥⬜🟥⬜🟥⬜⬜🟥🟥⬜⬜⬜🟥⬜⬜⬜🟥",
  "🟥⬜🟥⬜🟥⬜🟥🟥🟥⬜🟥🟥🟥🟥🟥⬜🟥",
  "🟥⬜⬜⬜🟥⬜🟥🟥🟥⬜🟥🟥🟥⬜⬜⬜🟥",
  "🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥",
  "🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥",
].join("\n")

/**
 * El logo, con el comando que lo guarda.
 *
 * `cd ~` porque la comprobacion busca el archivo en el directorio personal y el
 * estudiante puede estar en cualquier otro. Heredoc con el delimitador entre
 * comillas para que la shell no toque nada de lo que va dentro, y con eso se
 * acaban tanto el paso previo como el Ctrl+D del final: el archivo queda escrito
 * y cerrado de una vez.
 */
const SNIPPETS: Snippet[] = [
  {
    id: "logo-ufps",
    label: "Escribir el logo en la terminal",
    content: `cd ~ && cat > logo.txt <<'FIN'\n${LOGO_UFPS}\nFIN\n`,
  },
]

export function getSnippet(id: string): Snippet | undefined {
  return SNIPPETS.find((snippet) => snippet.id === id)
}
