/**
 * Bloque de codigo de una leccion: una caja sobria sobre la misma superficie de
 * la terminal real, sin cromatica de ventana (semaforo, barra de titulo) porque
 * competia con el contenido y hacia pasar por sesion de shell cosas que no lo
 * son, como diagramas ASCII o texto citado.
 *
 * Las sesiones de shell tienen su propio bloque, con entrada y salida a lado y
 * lado (ver TerminalBlock en lesson-body.tsx).
 */
export function CodeWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-white/10 bg-terminal-surface px-4 py-3 font-mono text-sm leading-6 text-zinc-100">
      {children}
    </div>
  )
}
