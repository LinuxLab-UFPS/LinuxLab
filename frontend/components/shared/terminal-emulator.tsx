"use client"

import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"
import { env } from "@/lib/config/env"

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
        foreground: "#e0e0e0",
        cursor: "#e0e0e0",
      },
    })
    termRef.current = term

    const fitAddon = new FitAddon()
    fitAddonRef.current = fitAddon
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    const ws = new WebSocket(`${WS_BASE}/terminal`)
    wsRef.current = ws

    ws.onopen = () => {
      const { cols, rows } = term
      ws.send(JSON.stringify({ type: "resize", cols, rows }))
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

    ws.onerror = () => {
      term.write("\r\n\x1b[31mError de conexión. ¿El servidor está corriendo?\x1b[0m\r\n")
    }

    ws.onclose = (event) => {
      if (event.code !== 1000) {
        term.write(`\r\n\x1b[33mConexión cerrada (${event.code}). ${event.reason || "¿El servidor está corriendo?"}\x1b[0m\r\n`)
      } else {
        term.write("\r\n\x1b[33mConexión cerrada.\x1b[0m\r\n")
      }
    }

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }))
      }
    })

    let resizeTimer: ReturnType<typeof setTimeout>
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        fitAddon.fit()
        const { cols, rows } = term
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols, rows }))
        }
      }, 100)
    })
    observer.observe(containerRef.current)

    return () => {
      ws.close()
      term.dispose()
      observer.disconnect()
      termRef.current = null
      wsRef.current = null
    }
  }, [])

  // Actualizar fontSize en vivo
  useEffect(() => {
    if (termRef.current) {
      (termRef.current as any).options.fontSize = fontSize
    }
  }, [fontSize])

  // Actualizar fontFamily en vivo
  useEffect(() => {
    if (termRef.current) {
      (termRef.current as any).options.fontFamily = fontFamily
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
