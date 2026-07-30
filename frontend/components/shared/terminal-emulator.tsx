"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"
import { env } from "@/lib/config/env"
import { useAuth } from "@/lib/features/auth/context"
import { apiFetch } from "@/lib/api/client"

const WS_BASE = env.backendUrl.replace(/^http/, "ws")

const FONTS = [
  { label: "Menlo (default)", value: "Menlo, Monaco, 'Courier New', monospace" },
  { label: "Fira Code", value: "'Fira Code', 'Cascadia Code', monospace" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { label: "Monospace", value: "monospace" },
]

const THEMES = [
  { label: "Sistema", value: "system" },
  { label: "Oscuro", value: "dark" },
  { label: "Claro", value: "light" },
]

export function TerminalEmulator({ className }: { className?: string }) {
  const { user } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [fontSize, setFontSize] = useState(user?.preferences?.terminalFontSize ?? 16)
  const [fontFamily, setFontFamily] = useState(
    user?.preferences?.terminalFontFamily ?? "Menlo, Monaco, 'Courier New', monospace",
  )

  const savePreference = useCallback(
    (key: string, value: number | string) => {
      setShowSettings(false)
      apiFetch("/api/preferences", {
        method: "PUT",
        body: JSON.stringify({ [key]: value }),
      }).catch(() => {})
    },
    [],
  )

  useEffect(() => {
    if (!containerRef.current) return

    const p = user?.preferences
    const initialFontSize = p?.terminalFontSize ?? 16
    const initialFontFamily = p?.terminalFontFamily ?? "Menlo, Monaco, 'Courier New', monospace"

    setFontSize(initialFontSize)
    setFontFamily(initialFontFamily)

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: initialFontSize,
      fontFamily: initialFontFamily,
      theme: {
        background: "#0a0a0a",
        foreground: "#e0e0e0",
        cursor: "#e0e0e0",
      },
    })
    termRef.current = term

    const fitAddon = new FitAddon()
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
        term.write(
          `\r\n\x1b[33mConexión cerrada (${event.code}). ${event.reason || "¿El servidor está corriendo?"}\x1b[0m\r\n`,
        )
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
  }, [user])

  const updateFontSize = useCallback((size: number) => {
    setFontSize(size)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(termRef.current as any)?.setOption?.("fontSize", size)
  }, [])

  const updateFontFamily = useCallback((family: string) => {
    setFontFamily(family)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(termRef.current as any)?.setOption?.("fontFamily", family)
  }, [])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className={className} style={{ height: "100%", width: "100%" }} />

      {/* Botón de ajustes */}
      <button
        type="button"
        onClick={() => setShowSettings(!showSettings)}
        aria-label="Ajustes de terminal"
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      {/* Dropdown de ajustes */}
      {showSettings && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowSettings(false)} />
          <div className="absolute right-2 top-10 z-40 w-64 rounded-lg border border-border bg-card p-4 shadow-xl">
            <h3 className="mb-3 text-sm font-medium text-foreground">Ajustes de terminal</h3>

            <label className="mb-1 block text-xs text-muted-foreground">Tamaño de fuente: {fontSize}px</label>
            <input
              type="range"
              min={12}
              max={24}
              step={1}
              value={fontSize}
              onChange={(e) => updateFontSize(Number(e.target.value))}
              onMouseUp={() => savePreference("terminalFontSize", fontSize)}
              className="mb-3 w-full"
            />

            <label className="mb-1 block text-xs text-muted-foreground">Fuente</label>
            <select
              value={fontFamily}
              onChange={(e) => {
                updateFontFamily(e.target.value)
                savePreference("terminalFontFamily", e.target.value)
              }}
              className="mb-3 w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  )
}
