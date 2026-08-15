/**
 * Colorea una linea de shell segun el papel de cada palabra: nombre del comando,
 * opciones y argumentos. Son los mismos colores del esquema
 * `comando [opciones] [argumentos]` de la leccion de anatomia, para que el
 * esquema se pueda leer encima de cualquier ejemplo real del curso.
 *
 * Es un coloreado por posicion, no un parser de Bash: alcanza para los comandos
 * de una leccion y no arrastra una dependencia de resaltado de sintaxis.
 */

/** Palabras que van delante del comando real: en `sudo apt`, el comando es `apt`. */
const PREFIXES = new Set(["sudo", "time", "nohup", "watch", "doas"])

/** Tras un conector vuelve a empezar un comando. */
const CONNECTORS = new Set(["|", "||", "&&", ";", "&", ">", ">>", "<", "2>", "2>&1"])

const ASSIGNMENT = /^([A-Za-z_][A-Za-z0-9_]*)(=.*)$/

export function ShellCommand({ line }: { line: string }) {
  const tokens = line.split(/(\s+)/)
  const parts: React.ReactNode[] = []
  let expectCommand = true

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token) continue

    if (/^\s+$/.test(token)) {
      parts.push(token)
      continue
    }

    // Un comentario se lleva el resto de la linea.
    if (token.startsWith("#")) {
      parts.push(
        <span key={i} className="cmd-comment">
          {tokens.slice(i).join("")}
        </span>,
      )
      break
    }

    if (CONNECTORS.has(token)) {
      parts.push(
        <span key={i} className="cmd-punct">
          {token}
        </span>,
      )
      expectCommand = true
      continue
    }

    if (expectCommand) {
      // `nombre='Juan'`: el nombre se lee como el comando y el valor como su dato.
      const assignment = token.match(ASSIGNMENT)
      if (assignment) {
        parts.push(
          <span key={i}>
            <span className="cmd-name">{assignment[1]}</span>
            <span className="cmd-arg">{assignment[2]}</span>
          </span>,
        )
        continue
      }
      parts.push(
        <span key={i} className="cmd-name">
          {token}
        </span>,
      )
      expectCommand = PREFIXES.has(token)
      continue
    }

    parts.push(
      <span key={i} className={token.startsWith("-") ? "cmd-opt" : "cmd-arg"}>
        {token}
      </span>,
    )
  }

  return <>{parts}</>
}
