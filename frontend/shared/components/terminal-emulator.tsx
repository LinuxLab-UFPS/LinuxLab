"use client"

import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"
import { onTerminalInput } from "@/lib/features/student/terminal-input"
import {
  asegurarSesion,
  enviarEntrada,
  escuchar,
  historialSesion,
  redimensionar,
} from "@shared/lib/terminal-session"

interface Props {
  className?: string
  fontSize?: number
  fontFamily?: string
}

/**
 * La pantalla de la terminal. Solo la pantalla: la conexion y la sesion viven
 * en `terminal-session.ts`, fuera de React.
 *
 * Este componente se monta y se desmonta a cada rato —al cambiar de pestaña, al
 * abrir la terminal de la leccion—, y cuando era el dueño del socket eso
 * significaba una conexion nueva cada vez. Ahora se engancha a la que ya hay:
 * repinta lo dicho hasta ahora y sigue en directo, asi que la sesion tampoco se
 * pierde al navegar.
 */
export function TerminalEmulator({ className, fontSize = 16, fontFamily = "Menlo, Monaco, 'Courier New', monospace" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize,
      fontFamily,
      theme: {
        background: "#1a1d24",
        foreground: "#ffffff",
        cursor: "#ffffff",
      },
    })
    termRef.current = term

    // En una terminal Ctrl+V no es pegar: es `lnext`, "toma la siguiente tecla
    // literal". xterm lo traduce a \x16 y cancela el evento, así que el pegado
    // del navegador nunca llega a ocurrir y el atajo de toda la vida no hace
    // nada. Devolviendo false, xterm ni lo procesa ni lo cancela: el navegador
    // dispara su propio evento de pegado, que xterm sí sabe atender.
    //
    // Ctrl+Shift+V (el atajo de terminal) sigue funcionando por su cuenta.
    term.attachCustomKeyEventHandler((event) => {
      const isPaste =
        event.type === "keydown" &&
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.code === "KeyV"
      return !isPaste
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    // Primero lo ya dicho y despues la suscripcion, en este orden: al reves se
    // perderia lo que llegara entre una cosa y otra.
    const anterior = historialSesion()
    if (anterior) term.write(anterior)
    const baja = escuchar((texto) => term.write(texto))

    asegurarSesion()
    redimensionar(term.cols, term.rows)

    term.onData(enviarEntrada)
    const unsubscribe = onTerminalInput(enviarEntrada)

    let resizeTimer: ReturnType<typeof setTimeout>
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        fitAddon.fit()
        redimensionar(term.cols, term.rows)
      }, 100)
    })
    observer.observe(containerRef.current)

    return () => {
      // Se va la pantalla, no la sesion: el socket sigue abierto y la PTY con
      // lo que estuviera corriendo dentro.
      clearTimeout(resizeTimer)
      baja()
      unsubscribe()
      observer.disconnect()
      term.dispose()
      termRef.current = null
    }
    // El terminal nace una sola vez con los valores iniciales de tamaño y
    // fuente; los cambios posteriores los aplican los effects de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Actualizar fontSize en vivo
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.fontSize = fontSize
    }
  }, [fontSize])

  // Actualizar fontFamily en vivo
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.fontFamily = fontFamily
    }
  }, [fontFamily])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: "100%", width: "100%" }}
    />
  )
}
