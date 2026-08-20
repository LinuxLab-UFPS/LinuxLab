"use client"

import { useEffect, useRef, useState } from "react"
import { TerminalFrame } from "@shared/components/terminal-frame"
import { useReveal, claseRevelado } from "@shared/hooks/use-reveal"
import { cn } from "@shared/lib/utils"
import {
  SimulatorTreeIllustration,
  SimulatorViIllustration,
  SimulatorPermissionsIllustration,
  SimulatorCompressionIllustration,
  SimulatorSearchIllustration,
} from "./topic-illustrations"

/**
 * El recorrido de la plataforma, en la portada del estudiante.
 *
 * Cuatro paneles que se revelan al entrar en pantalla, alternando el lado del
 * texto. Lo ve quien ya inicio sesion, asi que no es captacion: es para que
 * alguien que acaba de entrar entienda que hay una terminal de verdad, que los
 * simuladores estan hechos para cada tema y que las actividades se corrigen
 * mirando su maquina.
 *
 * Se ilustra con los SVG que ya existen en `topic-illustrations.tsx` y no con
 * capturas, siguiendo lo que dice la cabecera de `lesson-illustrations.tsx`:
 * una captura arrastra el escritorio, el tema y la distro de quien la tomo, y
 * ademas envejece con cada cambio de interfaz.
 *
 * Sobre las cifras: solo se afirma lo que no depende de quien use la
 * plataforma. Los temas y las lecciones son contenido fijo, asi que van con
 * numero; los simuladores van a crecer y las actividades las trae cada
 * asignatura, asi que esos dos paneles se cuentan sin cifras a proposito.
 */

/** Lo que se teclea en el panel de la terminal. */
const COMANDO = "ls -l /home/estudiante"
/** Caracteres por segundo. Por encima de esto deja de leerse como alguien
 *  escribiendo y parece un volcado de texto. */
const CPS = 14

const SIMULADORES = [
  { Ilustracion: SimulatorTreeIllustration, escenario: "cd y ls" },
  { Ilustracion: SimulatorViIllustration, escenario: "vi" },
  { Ilustracion: SimulatorPermissionsIllustration, escenario: "chmod y umask" },
  { Ilustracion: SimulatorCompressionIllustration, escenario: "tar" },
  { Ilustracion: SimulatorSearchIllustration, escenario: "grep, find y sort" },
]

/** El panel: texto a un lado, figura al otro, y se turnan. */
function Panel({
  titulo,
  children,
  figura,
  invertido = false,
}: {
  titulo: React.ReactNode
  children: React.ReactNode
  figura: React.ReactNode
  /** Con esto la figura va a la izquierda y el texto a la derecha. */
  invertido?: boolean
}) {
  const { ref, visible } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={cn(
        "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
        claseRevelado(visible),
      )}
    >
      <div className={cn("order-1", invertido && "lg:order-2")}>
        <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {titulo}
        </h3>
        <div className="mt-4 text-base leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
      <div className={cn("order-2", invertido && "lg:order-1")}>{figura}</div>
    </div>
  )
}

/** Un termino tecnico dentro del texto corrido. */
function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
      {children}
    </code>
  )
}

/**
 * La terminal que teclea.
 *
 * Es el unico elemento con movimiento continuo del bloque, y por eso es el que
 * retiene la mirada. El temporizador solo arranca cuando el panel esta visible
 * y se limpia al desmontar, para no dejarlo corriendo mientras el estudiante
 * usa el resto de la aplicacion.
 */
function TerminalQueTeclea() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.4)
  const [escrito, setEscrito] = useState("")
  const terminado = escrito.length === COMANDO.length
  const reducido = useRef(false)

  useEffect(() => {
    if (!visible) return

    reducido.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

    // Sin animacion, el comando aparece entero: el panel tiene que entenderse
    // igual sin movimiento.
    if (reducido.current) {
      setEscrito(COMANDO)
      return
    }

    let n = 0
    const id = window.setInterval(() => {
      n += 1
      setEscrito(COMANDO.slice(0, n))
      if (n >= COMANDO.length) window.clearInterval(id)
    }, 1000 / CPS)

    return () => window.clearInterval(id)
  }, [visible])

  return (
    <div ref={ref} className="neon-glow rounded-xl">
      <TerminalFrame title="estudiante@linuxlab: ~">
        <div className="p-3 font-mono text-sm leading-relaxed">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-bold text-[#3fb950]">estudiante@linuxlab:~$</span>
            <span className="text-white/90">{escrito}</span>
            {!terminado && <span className="cursor-blink text-white/90">▊</span>}
          </div>

          {/* La salida solo aparece cuando el comando termino de escribirse. */}
          <div
            className={cn(
              // El alto se reserva desde el principio para que la ventana no pegue
              // un salto cuando aparece la salida.
              "mt-2 min-h-[5.5rem] space-y-0.5 text-white/60 transition-opacity duration-500",
              terminado ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={!terminado}
          >
            <div>total 12</div>
            <div>drwxr-xr-x estudiante Documentos</div>
            <div>drwxr-xr-x estudiante practicas</div>
            <div>-rw-r--r-- estudiante notas.txt</div>
          </div>
        </div>
      </TerminalFrame>
    </div>
  )
}

/**
 * Los temas como un recorrido, no como una pila.
 *
 * La primera version apilaba tres ilustraciones con paralaje, pero al quedar
 * casi superpuestas solo se veia la de delante, y ademas competia con la reja
 * de temas que viene justo debajo. Un recorrido numerado dice lo que el titular
 * promete (que hay una ruta, y de donde a donde va) sin repetir el catalogo.
 */
function RutaDeTemas() {
  const { ref, visible } = useReveal<HTMLDivElement>()

  const paradas = [
    { n: 1, titulo: "Introducción a Linux", nota: "las partes del sistema" },
    { n: 4, titulo: "Manejo de archivos", nota: "crear, mover, comodines" },
    { n: 7, titulo: "Búsqueda", nota: "grep, find y expresiones" },
    { n: 9, titulo: "Gestión de procesos", nota: "ps, señales y daemons" },
  ]

  return (
    <div ref={ref} className="relative pl-8">
      {/* El riel que une las paradas: crece de arriba abajo al aparecer. */}
      <span
        aria-hidden
        className="absolute left-[11px] top-2 w-px bg-border transition-all duration-1000 ease-out motion-reduce:transition-none"
        style={{ height: visible ? "calc(100% - 1rem)" : "0%" }}
      />
      <ol className="space-y-5">
        {paradas.map((parada, i) => (
          <li
            key={parada.n}
            className={cn(
              "relative transition-all duration-500 ease-out motion-reduce:transition-none",
              visible ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0",
            )}
            style={{ transitionDelay: `${i * 130}ms` }}
          >
            <span
              aria-hidden
              className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card font-mono text-[11px] font-bold text-primary"
            >
              {parada.n}
            </span>
            <p className="font-semibold text-foreground">{parada.titulo}</p>
            <p className="text-sm text-muted-foreground">{parada.nota}</p>
          </li>
        ))}
      </ol>
      <p className="mt-5 font-mono text-xs text-muted-foreground">y cinco temas más</p>
    </div>
  )
}

/** La fila de simuladores, entrando escalonada. */
function FilaDeSimuladores() {
  const { ref, visible } = useReveal<HTMLDivElement>()

  return (
    <div ref={ref} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {SIMULADORES.map(({ Ilustracion, escenario }, i) => (
        <div
          key={escenario}
          className={cn(
            "rounded-xl border border-border bg-ilus-panel p-3",
            "transition-all duration-500 ease-out motion-reduce:transition-none",
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: `${i * 90}ms` }}
        >
          <div className="aspect-[16/10]">
            <Ilustracion />
          </div>
          <p className="mt-2 text-center font-mono text-[11px] text-white/60">
            {escenario}
          </p>
        </div>
      ))}
    </div>
  )
}

/** Lo que se comprueba de una actividad, como muestra. */
function FichaDeComprobaciones() {
  const { ref, visible } = useReveal<HTMLDivElement>()

  const comprobaciones = [
    "el directorio practicas existe",
    "notas.txt tiene al menos dos líneas",
    "arranque.sh es ejecutable",
    "informe.txt no lo puede escribir el grupo",
  ]

  return (
    <div
      ref={ref}
      className="neon-glow rounded-xl border border-border bg-card p-5"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        comprobaciones
      </p>
      <ul className="mt-3 space-y-2.5">
        {comprobaciones.map((texto, i) => (
          <li
            key={texto}
            className={cn(
              "flex items-start gap-2.5 text-sm text-foreground",
              "transition-all duration-500 ease-out motion-reduce:transition-none",
              visible ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0",
            )}
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
              aria-hidden
            >
              ✓
            </span>
            <span>{texto}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PlatformShowcase() {
  return (
    <section
      className="mx-auto max-w-7xl px-6 py-16 sm:py-20"
      aria-label="Qué ofrece la plataforma"
    >
      <div className="space-y-20 sm:space-y-28">
        <Panel
          titulo={<>Nueve temas. Treinta y seis lecciones.</>}
          figura={<RutaDeTemas />}
        >
          Teoría, video y práctica en una sola ruta, de la arquitectura del
          Kernel a la gestión de permisos.
        </Panel>

        <Panel
          invertido
          titulo={
            <>
              No es un simulador de terminal.{" "}
              <span className="text-primary">Es una terminal.</span>
            </>
          }
          figura={<TerminalQueTeclea />}
        >
          Cada estudiante recibe una cuenta real en un contenedor Linux por SSH.
          La sesión sigue viva mientras navegas, y la terminal te acompaña a
          pantalla completa o flotando sobre la lección.
        </Panel>

        <Panel
          titulo={<>Simuladores hechos a la medida de cada tema</>}
          figura={<FilaDeSimuladores />}
        >
          Un escenario propio para cada cosa que hay que aprender. Recorrer un
          árbol de directorios, sobrevivir a <Cmd>vi</Cmd>, arreglar permisos
          contra reloj, preparar una entrega comprimida o reconstruir qué tumbó
          el despliegue del viernes.
        </Panel>

        <Panel
          invertido
          titulo={<>Se califica tu máquina, no tu respuesta.</>}
          figura={<FichaDeComprobaciones />}
        >
          Cada actividad trae sus propias comprobaciones, que se verifican por
          SSH contra tu directorio personal real. No se entrega un archivo: se
          deja el sistema como se pidió.
        </Panel>
      </div>
    </section>
  )
}
