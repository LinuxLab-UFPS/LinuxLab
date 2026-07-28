/**
 * Terminal seam — legacy mock for pages not yet migrated to xterm.js.
 *
 * The full-screen terminal (/terminal) and the sidebar panel (TerminalPanel)
 * now use xterm.js via components/shared/terminal-emulator.tsx.
 *
 * Pages that haven't been migrated yet (activity, create-course) continue
 * to use this mock until they are rewritten in a future iteration.
 */

export interface TerminalResult {
  output: string
  clear?: boolean
}

export interface TerminalSession {
  readonly greeting: string[]
  run(command: string): Promise<TerminalResult>
}

export interface TerminalSessionOptions {
  user?: string
}

export function createTerminalSession(options: TerminalSessionOptions = {}): TerminalSession {
  const user = options.user ?? "student"
  return {
    greeting: ["Terminal mock activo — migrar a xterm.js."],
    async run(command: string): Promise<TerminalResult> {
      const cmd = command.trim().toLowerCase()
      if (cmd === "clear") return { output: "", clear: true }
      if (cmd.startsWith("echo ")) return { output: command.substring(5) }
      if (cmd === "whoami") return { output: user }
      if (cmd === "pwd") return { output: `/home/${user}` }
      return { output: `bash: ${command.split(" ")[0]}: command not found` }
    },
  }
}
