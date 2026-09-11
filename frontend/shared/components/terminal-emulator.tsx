"use client"

import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"
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

/** Una fuente que cualquier canvas sabe medir, para mientras llega la elegida. */
const FUENTE_RESERVA = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

/**
 * El nombre de fuente que xterm puede medir.
 *
 * xterm mide la celda en un OffscreenCanvas: pone `ctx.font = "16px <familia>"`
 * y mide una "W". Un canvas no entiende variables de CSS, asi que con
 * `var(--font-fira-code)` la asignacion se rechaza en silencio y mide con la
 * fuente que tuviera antes. Pintar, en cambio, lo hace el DOM, donde la variable
 * si se resuelve: celdas de una fuente y letras de otra, que es lo que se veia
 * descuadrado. Y como el canvas se quedaba con la ultima fuente valida, el
 * cambio de tamaño no se notaba hasta pasar por una que si lo fuera.
 *
 * «La del sistema» funcionaba porque ya es una lista de nombres literales. Esto
 * hace lo mismo con las demas: cambia cada `var(--x)` por lo que vale.
 */
function fuenteReal(familia: string): string {
  if (typeof window === "undefined") return familia
  const raiz = getComputedStyle(document.documentElement)
  return familia.replace(
    /var\((--[\w-]+)\)/g,
    (_, nombre: string) => raiz.getPropertyValue(nombre).trim() || "monospace",
  )
}

/**
 * Espera a que la fuente este descargada antes de medir.
 *
 * next/font las sirve con `display: swap` y el navegador no las baja hasta que
 * algo las usa. Si xterm mide antes, mide la de reserva y la rejilla sale con
 * el ancho equivocado aunque el nombre ya sea el bueno.
 */
async function cargarFuente(familia: string, tamano: number): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return
  try {
    await document.fonts.load(`${tamano}px ${familia}`)
  } catch {
    // Sin la fuente se mide con la de reserva, que es lo que habia antes.
  }
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
export function TerminalEmulator({ className, fontSize = 16, fontFamily = "var(--font-geist-mono), ui-monospace, monospace" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  /* El addon vive en una referencia y no dentro del efecto de montaje porque lo
     necesitan tambien los cambios de fuente: al cambiarla hay que volver a medir
     cuantas columnas caben. */
  const fitRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const contenedor = containerRef.current

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize,
      /* La de reserva y no la elegida: la elegida llega en el efecto de abajo,
         cuando ya esta descargada. Asi el cambio a la de verdad es un cambio de
         opcion y xterm vuelve a medir la celda con la fuente buena. */
      fontFamily: FUENTE_RESERVA,
      theme: {
        background: "#1a1d24",
        foreground: "#ffffff",
        cursor: "#ffffff",
      },
    })
    termRef.current = term

    // El pegado esta desactivado a proposito: la terminal se practica
    // escribiendo, y copiar la solucion de un enunciado no ensena el comando.
    //
    // Devolviendo true, xterm procesa Ctrl+V como lo que es en una terminal de
    // verdad —`lnext`, \x16— y cancela el evento del navegador, asi que el
    // pegado no llega a ocurrir.
    term.attachCustomKeyEventHandler((event) => {
      const esPegar =
        event.type === "keydown" &&
        (event.ctrlKey || event.metaKey) &&
        event.code === "KeyV"
      if (esPegar) {
        event.preventDefault()
        return false
      }
      return true
    })

    // El atajo no es la unica via: Ctrl+Shift+V, el clic derecho y el clic
    // central del raton disparan el evento de pegado sin pasar por el manejador
    // de teclas. Se corta en el propio elemento.
    const bloquearPegado = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }
    contenedor.addEventListener("paste", bloquearPegado, true)
    contenedor.addEventListener("auxclick", bloquearPegado, true)

    /* `vi` y compañía preguntan de qué color son el texto y el fondo con OSC 10
       y OSC 11, para decidir su paleta. Sin nadie que las atienda, xterm no las
       consume y la respuesta del propio terminal acaba escrita en el prompt como
       basura del tipo `rgb:ffff/ffff/ffff11`, que bash intenta ejecutar.

       Se responden con los colores del tema de arriba, en el formato que espera
       quien pregunta. Devolver true dice "ya está atendida", que es lo que evita
       que se cuele como texto. */
    const RESPUESTAS: Record<number, string> = {
      10: "rgb:ffff/ffff/ffff", // foreground #ffffff
      11: "rgb:1a1a/1d1d/2424", // background #1a1d24
    }
    for (const [codigo, color] of Object.entries(RESPUESTAS)) {
      term.parser.registerOscHandler(Number(codigo), (datos) => {
        if (datos === "?") enviarEntrada(`\x1b]${codigo};${color}\x1b\\`)
        return true
      })
    }

    const fitAddon = new FitAddon()
    fitRef.current = fitAddon
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
      contenedor.removeEventListener("paste", bloquearPegado, true)
      contenedor.removeEventListener("auxclick", bloquearPegado, true)
      baja()
      observer.disconnect()
      term.dispose()
      termRef.current = null
    }
    // El terminal nace una sola vez con los valores iniciales de tamaño y
    // fuente; los cambios posteriores los aplican los effects de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* La letra cambia de tamaño o de familia, y con ella el ancho del caracter:
     hay que volver a contar cuantas columnas caben.

     Sin esto la consola se quedaba con las columnas de antes y la shell seguia
     partiendo la linea donde ya no toca: al subir la fuente, esas columnas no
     caben en la caja y el texto se salia por la derecha.

     El `fit()` no basta por si solo: quien decide donde parte la linea es la PTY
     del contenedor, asi que el ancho nuevo tiene que viajar por el socket, que
     es lo que hace `redimensionar`. Mismo freno que el observador del
     contenedor: arrastrar la barra dispara un cambio por paso. */
  useEffect(() => {
    const term = termRef.current
    if (!term) return
    let vigente = true
    let id: ReturnType<typeof setTimeout> | undefined
    // Nombre literal y fuente descargada ANTES de tocar xterm: ver `fuenteReal`.
    const real = fuenteReal(fontFamily)

    cargarFuente(real, fontSize).then(() => {
      // Si llego otro cambio mientras bajaba la fuente, este ya no manda.
      if (!vigente) return
      term.options.fontSize = fontSize
      term.options.fontFamily = real
      id = setTimeout(() => {
        fitRef.current?.fit()
        redimensionar(term.cols, term.rows)
      }, 100)
    })

    return () => {
      vigente = false
      clearTimeout(id)
    }
  }, [fontSize, fontFamily])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: "100%", width: "100%" }}
    />
  )
}
