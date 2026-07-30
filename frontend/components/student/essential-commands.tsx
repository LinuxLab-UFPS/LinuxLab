interface Command {
  name: string
  args?: string
  description: string
}

// Cubre lo ya enseñado en tema 2 (La Terminal) y tema 3 (Directorios):
// pwd/ls/cd (navegación esencial), cat (lectura de archivos), mkdir/touch (creación).
const COMMANDS: Command[] = [
  { name: "pwd", description: "Imprime el directorio de trabajo actual." },
  { name: "ls", args: "[-la]", description: "Lista el contenido de un directorio." },
  { name: "cd", args: "<ruta>", description: "Cambia el directorio actual." },
  { name: "cat", args: "<archivo>", description: "Muestra el contenido de un archivo." },
  { name: "mkdir", args: "[-p] <nombre>", description: "Crea un directorio nuevo." },
  { name: "touch", args: "<archivo>", description: "Crea un archivo vacío o actualiza su fecha." },
]

/** Static cheat-sheet of the basic commands, always visible next to the terminal. */
export function EssentialCommands() {
  return (
    <div className="rounded-xl border border-black/15 bg-background p-4 dark:border-border">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Comandos esenciales</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {COMMANDS.map((cmd) => (
          <div
            key={cmd.name}
            className="rounded-lg border border-primary/40 bg-primary/10 p-2.5"
          >
            <p className="font-mono text-sm font-bold text-primary [text-shadow:var(--neon-text-shadow)]">
              {cmd.name}
              {cmd.args && <span className="ml-1 font-normal opacity-80">{cmd.args}</span>}
            </p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">{cmd.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
