"use client"

import { useReveal, claseRevelado } from "@shared/hooks/use-reveal"
import { cn } from "@shared/lib/utils"
import { syllabus, getTopic } from "@shared/lib/content/temario"
import {
  SimulatorTreeIllustration,
  SimulatorViIllustration,
  SimulatorPermissionsIllustration,
  SimulatorCompressionIllustration,
  SimulatorSearchIllustration,
  SimulatorProcessesIllustration,
} from "./topic-illustrations"

/**
 * El recorrido de la plataforma, en la portada publica.
 *
 * Cuatro paneles que se revelan al entrar en pantalla, alternando el lado del
 * texto. Van en dos exportaciones y no en una, porque la portada los separa en
 * dos franjas de fondo distinto; los paneles de dentro son los mismos.
 *
 * Esto SI es captacion: lo ve quien todavia no ha entrado, y su trabajo es que
 * entienda que hay una terminal de verdad detras, que los simuladores estan
 * hechos para cada tema y que las actividades se corrigen mirando su maquina.
 * Cuando vivia en el panel del estudiante no lo era, y por eso el texto hablaba
 * de otra forma.
 *
 * Se ilustra con los SVG que ya existen en `topic-illustrations.tsx` y no con
 * capturas, siguiendo lo que dice la cabecera de `lesson-illustrations.tsx`:
 * una captura arrastra el escritorio, el tema y la distro de quien la tomo, y
 * ademas envejece con cada cambio de interfaz.
 *
 * Aqui no se afirman cifras: las actividades las trae cada asignatura, y un
 * recuento de temas envejece en cuanto se toca el temario.
 */

export const TEMAS = syllabus.length
export const LECCIONES = syllabus.reduce((total, t) => total + t.subTopics.length, 0)

const UNIDADES = [
  "cero", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho",
  "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis",
  "diecisiete", "dieciocho", "diecinueve", "veinte",
]
const DECENAS = [
  "", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta",
  "ochenta", "noventa",
]
/** Los veintitantos van sueltos porque llevan tilde donde el resto no. */
const VEINTI = [
  "", "veintiún", "veintidós", "veintitrés", "veinticuatro", "veinticinco",
  "veintiséis", "veintisiete", "veintiocho", "veintinueve",
]

/**
 * El numero en letra, que es como lee un titular. Por encima de noventa y nueve
 * devuelve la cifra: el temario no va a llegar ahi, y una cadena rara se nota
 * menos que un numero mal escrito.
 */
export function enLetra(n: number, genero: "m" | "f" = "m"): string {
  const palabra =
    n <= 20
      ? UNIDADES[n]
      : n % 10 === 0
        ? DECENAS[Math.floor(n / 10)]
        : n < 30
          ? VEINTI[n % 10]
          : n < 100
            ? `${DECENAS[Math.floor(n / 10)]} y ${UNIDADES[n % 10]}`
            : String(n)
  if (genero !== "f") return palabra
  // «un» pasa a «una», y con tilde la pierde: veintiún → veintiuna.
  if (palabra.endsWith("veintiún")) return palabra.replace("veintiún", "veintiuna")
  return palabra.endsWith("un") ? `${palabra}a` : palabra
}

export const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const SIMULADORES = [
  { Ilustracion: SimulatorTreeIllustration, escenario: "cd y ls" },
  { Ilustracion: SimulatorViIllustration, escenario: "vi" },
  { Ilustracion: SimulatorPermissionsIllustration, escenario: "chmod y umask" },
  { Ilustracion: SimulatorCompressionIllustration, escenario: "tar" },
  { Ilustracion: SimulatorSearchIllustration, escenario: "grep, find y sort" },
  { Ilustracion: SimulatorProcessesIllustration, escenario: "ps, pkill y señales" },
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

/**
 * Los temas como un recorrido, no como una pila.
 *
 * La primera version apilaba tres ilustraciones con paralaje, pero al quedar
 * casi superpuestas solo se veia la de delante, y ademas competia con la reja
 * de temas que viene justo debajo. Un recorrido numerado dice lo que el titular
 * promete (que hay una ruta, y de donde a donde va) sin repetir el catalogo.
 */
export function RutaDeTemas() {
  const { ref, visible } = useReveal<HTMLDivElement>()

  // Cuatro paradas repartidas por el temario, para que se vea de dónde a dónde
  // va. El título sale del temario y no de aquí: escribirlo a mano era otra
  // copia que se quedaba vieja al renombrar un tema.
  const paradas = [
    { n: 1, nota: "las partes del sistema" },
    { n: 4, nota: "crear, mover, comodines" },
    { n: 7, nota: "grep, find y expresiones" },
    { n: 10, nota: "condicionales, ciclos y funciones" },
  ].map((p) => ({ ...p, titulo: getTopic(p.n)?.title ?? `Tema ${p.n}` }))

  const restantes = TEMAS - paradas.length

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
      <p className="mt-5 font-mono text-xs text-muted-foreground">
        y {enLetra(restantes)} temas más
      </p>
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

/** El envoltorio comun de los dos bloques. */
function Bloque({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20" aria-label={etiqueta}>
      <div className="space-y-20 sm:space-y-28">{children}</div>
    </section>
  )
}

/** Segundo bloque: con qué se practica y cómo se corrige. */
export function ShowcaseSimuladoresYPruebas() {
  return (
    <Bloque etiqueta="Simuladores y comprobaciones">
      <Panel
        titulo={<>Simuladores que ponen los conceptos en contexto</>}
        figura={<FilaDeSimuladores />}
      >
        Cada simulador plantea una situación del día a día en la que manejar la
        terminal es lo que la resuelve. En vez de repasar opciones sueltas, se
        practica decidiendo qué comando hace falta y por qué, con el mismo
        criterio que exige un sistema real.
      </Panel>

      <Panel
        invertido
        titulo={<>Actividades que revisan el estado del entorno</>}
        figura={<FichaDeComprobaciones />}
      >
        Cada actividad trae sus propias comprobaciones, que se verifican por SSH
        contra el directorio personal de los usuarios. Se verifica que el entorno
        quede como se pidió.
      </Panel>
    </Bloque>
  )
}
