"use client"

import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"
import { env } from "@/lib/config/env"
import { onTerminalInput, markTerminalReady } from "@/lib/features/student/terminal-input"

const WS_BASE = env.backendUrl.replace(/^http/, "ws")

interface Props {
  className?: string
  fontSize?: number
  fontFamily?: string
}

export function TerminalEmulator({ className, fontSize = 16, fontFamily = "Menlo, Monaco, 'Courier New', monospace" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

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
    fitAddonRef.current = fitAddon
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    // Reintentos al abrir.
    //
    // El boton de "Reset terminal" remonta este componente, asi que el socket
    // nuevo sale mientras el anterior todavia se esta cerrando, y el del medio
    // corta ese primer intento (NS_ERROR_NET_RESET, sin llegar a negociar).
    // Recargar la pagina no fallaba nunca porque tarda lo suficiente.
    //
    // En vez de perseguir quien lo corta, se reintenta: si la conexion muere
    // antes de haberse abierto, se prueba de nuevo con una espera creciente.
    // El primer intento no anuncia nada —lo normal es que funcione— y solo se
    // avisa al usuario si hay que esperar de verdad.
    const ESPERAS = [500, 1200, 2500]
    let intento = 0
    let abierta = false
    let cerrado = false
    let reintento: ReturnType<typeof setTimeout> | undefined

    const conectar = () => {
      if (cerrado) return
      const ws = new WebSocket(`${WS_BASE}/terminal`)
      wsRef.current = ws

      ws.onopen = () => {
        abierta = true
        const { cols, rows } = term
        ws.send(JSON.stringify({ type: "resize", cols, rows }))
        // La terminal está lista: los comandos que llegaron antes (p. ej. el cd
        // a la carpeta de trabajo al abrir una actividad) se vacían en orden.
        markTerminalReady()
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === "output") term.write(msg.data)
          if (msg.type === "exit") {
            term.write(`\r\n[Process exited with code ${msg.code}]\r\n`)
          }
        } catch {
          /**/
        }
      }

      // El error de socket no dice nada util por si mismo y siempre viene
      // seguido de un close: se informa alli, con el codigo.
      ws.onerror = () => {}

      ws.onclose = (event) => {
        if (cerrado) return

        // Nunca llego a abrirse y quedan intentos: es el caso del boton.
        if (!abierta && intento < ESPERAS.length) {
          const espera = ESPERAS[intento]
          intento += 1
          if (intento > 1) term.write("\r\n\x1b[33mReconectando…\x1b[0m\r\n")
          reintento = setTimeout(conectar, espera)
          return
        }

        if (!abierta) {
          term.write("\r\n\x1b[31mNo se pudo conectar con la terminal.\x1b[0m\r\n")
          term.write("\x1b[92mRecarga la página para volver a intentarlo.\x1b[0m\r\n")
          return
        }

        // La sesion estuvo viva y se cerro. El mensaje de antes preguntaba si
        // el servidor estaba corriendo, y casi nunca era eso: lo normal es
        // haber salido de la pestaña, haber escrito `exit` o que saltara el
        // cierre por inactividad. Decirlo y ofrecer la salida vale mas que un
        // codigo de error.
        const motivo = event.reason && event.reason.trim() ? event.reason.trim() : null
        term.write("\r\n\x1b[33mLa sesión de la terminal se cerró.\x1b[0m\r\n")
        if (motivo) term.write(`\x1b[37m${motivo}\x1b[0m\r\n`)
        term.write("\x1b[92mPulsa «Reset terminal» para abrir una nueva.\x1b[0m\r\n")
      }
    }

    conectar()

    const write = (data: string) => {
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }))
      }
    }

    term.onData(write)
    const unsubscribe = onTerminalInput(write)

    let resizeTimer: ReturnType<typeof setTimeout>
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        fitAddon.fit()
        const { cols, rows } = term
        const ws = wsRef.current
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols, rows }))
        }
      }, 100)
    })
    observer.observe(containerRef.current)

    return () => {
      cerrado = true
      clearTimeout(reintento)
      unsubscribe()
      wsRef.current?.close()
      term.dispose()
      observer.disconnect()
      termRef.current = null
      wsRef.current = null
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
