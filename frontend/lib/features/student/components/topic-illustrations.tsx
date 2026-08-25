import type { ComponentType, ReactNode } from "react"

/**
 * One line-art illustration per topic, drawn on the card's panel in the
 * AlgoMaster style: neutral strokes with a neon-red accent. Look them up with
 * `topicIllustration(number)`; topics without a match fall back to a generic one.
 *
 * Los colores son fijos y no salen del tema: estos dibujos van siempre sobre el
 * panel oscuro (--ilus-panel), tambien con el sitio en claro. Se probo a
 * invertirlos —tinta oscura sobre un panel gris— y perdian el aire de rotulo de
 * neon, que es justo lo que les da caracter.
 */

const LINE = "#c9d1d9" // near-white strokes
const BASE = "#8b949e" // muted gray details
const RED = "#f43f5e" // neon-red accent

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      {children}
    </svg>
  )
}

/** A reusable terminal window frame. */
function TerminalFrame({ children }: { children?: ReactNode }) {
  return (
    <>
      <rect x="38" y="24" width="124" height="72" rx="8" stroke={LINE} strokeWidth="2.5" />
      <line x1="38" y1="40" x2="162" y2="40" stroke={BASE} strokeWidth="1.5" />
      <circle cx="50" cy="32" r="2.5" fill={RED} />
      <circle cx="60" cy="32" r="2.5" fill={BASE} />
      <circle cx="70" cy="32" r="2.5" fill={BASE} />
      {children}
    </>
  )
}

/** 1. Introducción a Linux — Tux the penguin. */
function IntroLinux() {
  return (
    <Svg>
      <path d="M74 62 q-9 15 4 27" stroke={LINE} strokeWidth="2.5" />
      <path d="M126 62 q9 15 -4 27" stroke={LINE} strokeWidth="2.5" />
      <ellipse cx="100" cy="60" rx="29" ry="37" fill="none" stroke={LINE} strokeWidth="2.5" />
      <ellipse cx="100" cy="66" rx="17" ry="25" fill="none" stroke={BASE} strokeWidth="1.8" />
      <circle cx="91" cy="45" r="3" fill={LINE} />
      <circle cx="109" cy="45" r="3" fill={LINE} />
      <path d="M94 53 h12 l-6 6 z" fill={RED} />
      <path d="M86 95 q-7 6 3 8 q7 -1 7 -6" fill={RED} />
      <path d="M114 95 q7 6 -3 8 q-7 -1 -7 -6" fill={RED} />
    </Svg>
  )
}

/** 2. La Terminal — prompt with a blinking cursor. */
function TerminalTopic() {
  return (
    <Svg>
      <TerminalFrame>
        <path d="M52 54 l7 6 l-7 6" stroke={RED} strokeWidth="2.5" />
        <line x1="66" y1="60" x2="112" y2="60" stroke={BASE} strokeWidth="2.5" />
        <line x1="52" y1="76" x2="96" y2="76" stroke={BASE} strokeWidth="2.5" />
        <rect x="102" y="71" width="7" height="10" fill={RED} />
      </TerminalFrame>
    </Svg>
  )
}

/** Small folder glyph. */
function Folder({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <path
      d={`M${x} ${y} h9 l3 3 h11 v13 h-23 z`}
      fill="none"
      stroke={color}
      strokeWidth="2.2"
    />
  )
}

/** 3. Directorios — a folder tree. */
function Directories() {
  return (
    <Svg>
      <Folder x={88} y={18} color={RED} />
      <path
        d="M99 34 v10 M52 44 h94 M52 44 v8 M99 44 v8 M146 44 v8"
        stroke={BASE}
        strokeWidth="1.6"
      />
      <Folder x={40} y={52} color={LINE} />
      <Folder x={87} y={52} color={LINE} />
      <Folder x={134} y={52} color={LINE} />
      <path d="M46 88 h20 M46 96 h14" stroke={BASE} strokeWidth="2" />
      <path d="M93 88 h20 M93 96 h14" stroke={BASE} strokeWidth="2" />
      <path d="M140 88 h20 M140 96 h14" stroke={BASE} strokeWidth="2" />
    </Svg>
  )
}

/** A document glyph with a folded corner. */
function FileGlyph({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <path
      d={`M${x} ${y} h20 l10 10 v30 h-30 z M${x + 20} ${y} v10 h10`}
      fill="none"
      stroke={color}
      strokeWidth="2.4"
    />
  )
}

/** 4. Creación de archivos — a new file with a plus badge. */
function Files() {
  return (
    <Svg>
      <FileGlyph x={70} y={30} color={LINE} />
      <line x1="78" y1="58" x2="102" y2="58" stroke={BASE} strokeWidth="2" />
      <line x1="78" y1="66" x2="98" y2="66" stroke={BASE} strokeWidth="2" />
      <circle cx="118" cy="78" r="13" fill="none" stroke={RED} strokeWidth="2.5" />
      <path d="M118 72 v12 M112 78 h12" stroke={RED} strokeWidth="2.5" />
    </Svg>
  )
}

/** 5. Permisos — a shield with rwx bits. */
function Permissions() {
  return (
    <Svg>
      <path
        d="M100 22 l30 10 v24 q0 26 -30 40 q-30 -14 -30 -40 v-24 z"
        fill="none"
        stroke={LINE}
        strokeWidth="2.5"
      />
      <path d="M88 60 l8 9 l18 -20" stroke={RED} strokeWidth="3" />
    </Svg>
  )
}

/** 6. Compresión — files squeezed into an archive by arrows. */
function Compression() {
  return (
    <Svg>
      <rect x="82" y="38" width="36" height="46" rx="4" stroke={LINE} strokeWidth="2.5" />
      <path d="M100 38 v46" stroke={BASE} strokeWidth="1.6" strokeDasharray="4 4" />
      <rect x="95" y="46" width="10" height="7" fill={RED} />
      <rect x="95" y="59" width="10" height="7" fill={BASE} />
      <path d="M52 61 h20 M66 55 l8 6 l-8 6" stroke={RED} strokeWidth="2.5" />
      <path d="M148 61 h-20 M134 55 l-8 6 l8 6" stroke={RED} strokeWidth="2.5" />
    </Svg>
  )
}

/** 7. Búsqueda — magnifying glass over lines, one match highlighted. */
function Search() {
  return (
    <Svg>
      <line x1="58" y1="40" x2="120" y2="40" stroke={BASE} strokeWidth="2.4" />
      <line x1="58" y1="54" x2="110" y2="54" stroke={RED} strokeWidth="2.8" />
      <line x1="58" y1="68" x2="118" y2="68" stroke={BASE} strokeWidth="2.4" />
      <line x1="58" y1="82" x2="98" y2="82" stroke={BASE} strokeWidth="2.4" />
      <circle cx="126" cy="70" r="18" fill="none" stroke={LINE} strokeWidth="2.8" />
      <line x1="139" y1="83" x2="152" y2="96" stroke={LINE} strokeWidth="3" />
    </Svg>
  )
}

/** A single user glyph (head + shoulders). */
function UserGlyph({ x, color }: { x: number; color: string }) {
  return (
    <>
      <circle cx={x} cy="52" r="10" fill="none" stroke={color} strokeWidth="2.4" />
      <path d={`M${x - 16} 88 q0 -18 16 -18 q16 0 16 18`} fill="none" stroke={color} strokeWidth="2.4" />
    </>
  )
}

/** 8. Usuarios y grupos — three users, one accented. */
function Users() {
  return (
    <Svg>
      <UserGlyph x={70} color={BASE} />
      <UserGlyph x={130} color={BASE} />
      <UserGlyph x={100} color={RED} />
    </Svg>
  )
}

/** 9. Gestión de procesos — a process monitor with bars. */
function Processes() {
  return (
    <Svg>
      <rect x="40" y="26" width="120" height="68" rx="8" stroke={LINE} strokeWidth="2.5" />
      <line x1="40" y1="42" x2="160" y2="42" stroke={BASE} strokeWidth="1.5" />
      <rect x="52" y="52" width="60" height="7" rx="3.5" fill={BASE} />
      <rect x="52" y="66" width="88" height="7" rx="3.5" fill={RED} />
      <rect x="52" y="80" width="44" height="7" rx="3.5" fill={BASE} />
    </Svg>
  )
}

/** A stacked server unit. */
function ServerUnit({ y, accent }: { y: number; accent?: boolean }) {
  return (
    <>
      <rect x="60" y={y} width="80" height="20" rx="4" stroke={LINE} strokeWidth="2.4" />
      <circle cx="72" cy={y + 10} r="2.6" fill={accent ? RED : BASE} />
      <line x1="84" y1={y + 10} x2="128" y2={y + 10} stroke={BASE} strokeWidth="2" />
    </>
  )
}

/** 10. Servicios y demonios — a server stack with a gear. */
function Services() {
  return (
    <Svg>
      <ServerUnit y={22} />
      <ServerUnit y={48} accent />
      <ServerUnit y={74} />
      <circle cx="140" cy="84" r="11" fill="none" stroke={RED} strokeWidth="2.4" />
      <circle cx="140" cy="84" r="3.5" fill={RED} />
      <path
        d="M140 71 v-5 M140 102 v-5 M153 84 h5 M122 84 h5 M149 75 l4 -4 M127 97 l4 -4 M149 93 l4 4 M127 71 l4 4"
        stroke={RED}
        strokeWidth="2"
      />
    </Svg>
  )
}

/** 11. Shell scripting — a script window with a shebang and braces. */
function Scripting() {
  return (
    <Svg>
      <TerminalFrame>
        <path d="M54 52 h8 M58 52 v18 M54 70 h8" stroke={RED} strokeWidth="2.4" />
        <line x1="72" y1="54" x2="120" y2="54" stroke={BASE} strokeWidth="2.2" />
        <line x1="80" y1="65" x2="122" y2="65" stroke={BASE} strokeWidth="2.2" />
        <line x1="80" y1="76" x2="110" y2="76" stroke={BASE} strokeWidth="2.2" />
        <path d="M146 52 h-8 M142 52 v18 M146 70 h-8" stroke={RED} strokeWidth="2.4" />
      </TerminalFrame>
    </Svg>
  )
}

/** 12. Instalación de paquetes — a package box with a download arrow. */
function Packages() {
  return (
    <Svg>
      <path d="M100 40 l30 15 v26 l-30 15 l-30 -15 v-26 z" fill="none" stroke={LINE} strokeWidth="2.5" />
      <path d="M70 55 l30 15 l30 -15 M100 70 v36" stroke={BASE} strokeWidth="1.8" />
      <path d="M100 20 v18 M92 32 l8 8 l8 -8" stroke={RED} strokeWidth="2.8" />
    </Svg>
  )
}

/**
 * Simulador de compresion: las hojas sueltas entran en un paquete cerrado y el
 * paquete se manda.
 *
 * El paquete era un rectangulo plano partido en franjas, y a ese tamaño se leia
 * igual que la ventana con lineas del simulador de vi — dos dibujos distintos
 * que parecian el mismo. Ahora es una caja en perspectiva con su cinta cruzada:
 * un volumen, no un panel, que es ademas lo que un archivo comprimido es. Las
 * hojas van en abanico para que se vea que son varias y el paquete uno solo,
 * que es de lo que va comprimir.
 */
export function SimulatorCompressionIllustration() {
  return (
    <Svg>
      {/* las hojas sueltas, en abanico */}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${16 + i * 6} ${26 + i * 8} h20 l7 7 v25 h-27 Z`}
          stroke={i === 2 ? LINE : BASE}
          strokeWidth="1.8"
          opacity={i === 2 ? 1 : 0.5}
        />
      ))}

      {/* entran al paquete */}
      <path d="M68 58 h16 M78 52 l7 6 l-7 6" stroke={RED} strokeWidth="2.4" />

      {/* la caja: en perspectiva, para que sea un bulto y no una ventana */}
      <path d="M140 26 l26 13 v26 l-26 13 l-26 -13 v-26 Z" stroke={LINE} strokeWidth="2.2" />
      <path d="M114 39 l26 13 l26 -13" stroke={BASE} strokeWidth="1.6" />
      <path d="M140 52 v26" stroke={BASE} strokeWidth="1.6" />
      {/* la cinta que la sella, cruzando la cara de arriba */}
      <path d="M127 32.5 l26 13" stroke={RED} strokeWidth="2" />

      {/* y se manda */}
      <path d="M130 86 h30 v18 h-30 Z" stroke={RED} strokeWidth="2" />
      <path d="M130 86 l15 11 l15 -11" stroke={RED} strokeWidth="2" />
    </Svg>
  )
}

/**
 * Simulador de procesos: la ventana del monitor con sus barras de consumo.
 *
 * Las barras son de alturas muy distintas y la mas alta va en rojo, que es lo
 * que el estudiante ve al abrirlo: unos pocos procesos comiendose la maquina
 * mientras el resto apenas gasta. La tijera de al lado dice que es lo que hay
 * que hacer con ellos.
 */
export function SimulatorProcessesIllustration() {
  // Alturas del grafico, en orden: dos que se disparan y tres normales.
  const barras = [
    { x: 34, alto: 46, gorda: true },
    { x: 52, alto: 34, gorda: true },
    { x: 70, alto: 14, gorda: false },
    { x: 88, alto: 9, gorda: false },
    { x: 106, alto: 18, gorda: false },
  ]
  return (
    <Svg>
      {/* la ventana del monitor */}
      <path d="M20 22 h108 v76 h-108 Z" stroke={LINE} strokeWidth="2" />
      <path d="M20 34 h108" stroke={BASE} strokeWidth="1.6" />
      {[27, 34, 41].map((cx) => (
        <circle key={cx} cx={cx} cy={28} r={2.2} fill={BASE} />
      ))}

      {/* las barras de consumo, apoyadas en la misma linea */}
      {barras.map((b) => (
        <rect
          key={b.x}
          x={b.x}
          y={86 - b.alto}
          width={11}
          height={b.alto}
          rx={2}
          stroke={b.gorda ? RED : BASE}
          strokeWidth="2"
          fill="none"
        />
      ))}
      <path d="M28 86 h94" stroke={BASE} strokeWidth="1.6" opacity="0.6" />

      {/* la tijera: lo que sobra se corta */}
      <path d="M150 40 l24 34 M174 40 l-24 34" stroke={RED} strokeWidth="2.4" />
      <circle cx={147} cy={80} r={6} stroke={RED} strokeWidth="2.2" />
      <circle cx={177} cy={80} r={6} stroke={RED} strokeWidth="2.2" />
    </Svg>
  )
}

/** Simulador de busqueda: una lupa recorre un log y encuentra la linea que
 *  no encaja, y el hallazgo sale por el chat. */
export function SimulatorSearchIllustration() {
  const BLUE = "#4a9eff"
  return (
    <Svg>
      {/* el log: lineas de texto, una de ellas marcada */}
      <path d="M26 30 h74 M26 42 h60 M26 66 h74 M26 78 h52 M26 90 h66" stroke={BASE} strokeWidth="1.8" opacity="0.55" />
      <path d="M26 54 h48" stroke={RED} strokeWidth="2.4" />

      {/* la lupa, justo sobre la linea marcada */}
      <circle cx="86" cy="54" r="17" stroke={LINE} strokeWidth="2.2" />
      <path d="M98 66 l12 12" stroke={LINE} strokeWidth="2.6" />

      {/* el hallazgo se manda por el chat */}
      <path d="M132 34 h38 a4 4 0 0 1 4 4 v24 a4 4 0 0 1 -4 4 h-22 l-10 8 v-8 h-6 a4 4 0 0 1 -4 -4 v-24 a4 4 0 0 1 4 -4 Z"
        stroke={BLUE} strokeWidth="2" />
      <circle cx="142" cy="50" r="2.2" fill={BLUE} />
      <circle cx="151" cy="50" r="2.2" fill={BLUE} />
      <circle cx="160" cy="50" r="2.2" fill={BLUE} />
    </Svg>
  )
}

const ILLUSTRATIONS: Record<number, ComponentType> = {
  1: IntroLinux,
  2: TerminalTopic,
  3: Directories,
  4: Files,
  5: Permissions,
  6: Compression,
  7: Search,
  8: Users,
  9: Processes,
  10: Services,
  11: Scripting,
  12: Packages,
}

/** The illustration for a topic number, defaulting to the terminal one. */
export function topicIllustration(topicNumber: number): ComponentType {
  return ILLUSTRATIONS[topicNumber] ?? TerminalTopic
}

/**
 * La travesia del arbol: un arbol con un camino.
 *
 * Lo que distingue a este simulador es que hay un sitio donde estas, otro al
 * que tienes que llegar y una ruta entre los dos. Eso es todo lo que se dibuja:
 * la raiz, un desvio que no se toma, el directorio por el que se pasa y el
 * objetivo con el recuadro de puntos que el propio simulador le pone.
 *
 * Llego a tener dos niveles mas, cuatro carpetas sueltas y un prompt dibujado
 * abajo. A tamaño de tarjeta no se leia ninguno: era una maraña de recuadros, y
 * el prompt encima sobraba, porque la terminal no es lo que esta tarjeta cuenta.
 */
export function SimulatorTreeIllustration() {
  return (
    <Svg>
      {/* el desvio que no se toma */}
      <path d="M99.5 32 v12 M99.5 44 H59.5 M59.5 44 v12" stroke={BASE} strokeWidth="1.8" />

      {/* el camino, por encima */}
      <path d="M99.5 32 v12 M99.5 44 H138.5 M138.5 44 v12 M138.5 72 v12" stroke={RED} strokeWidth="2.6" />

      {/* la raiz */}
      <Folder x={88} y={16} color={LINE} />

      {/* el desvio, y el directorio de paso */}
      <Folder x={48} y={56} color={BASE} />
      <Folder x={127} y={56} color={LINE} />

      {/* el objetivo */}
      <rect
        x={123}
        y={80}
        width={31}
        height={24}
        rx={4}
        stroke={RED}
        strokeWidth="1.6"
        strokeDasharray="4 3"
        opacity="0.75"
      />
      <Folder x={127} y={84} color={RED} />
    </Svg>
  )
}


/**
 * Los retos de vi: la ventana del editor con sus lineas, las tildes que marcan
 * el final del archivo y el cursor de bloque, que es la seña de que se esta en
 * modo normal y no escribiendo.
 */
export function SimulatorViIllustration() {
  return (
    <Svg>
      {/* marco de la ventana */}
      <rect x={28} y={20} width={144} height={82} rx={6} stroke={LINE} strokeWidth="2" />
      <path d="M28 34 h144" stroke={LINE} strokeWidth="1.6" />
      <circle cx={38} cy={27} r={2.4} fill={BASE} />
      <circle cx={47} cy={27} r={2.4} fill={BASE} />
      <circle cx={56} cy={27} r={2.4} fill={BASE} />

      {/* lineas de texto */}
      <path
        d="M40 47 h56 M40 59 h74 M40 71 h44"
        stroke={BASE}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* el cursor de bloque, en la linea que se esta editando */}
      <rect x={90} y={65} width={9} height={11} fill={RED} />

      {/* las tildes del final del archivo */}
      <path d="M40 84 h5 M40 93 h5" stroke={BASE} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}


/**
 * El filtro de permisos: el expediente que llega a la mesa con su rejilla de
 * nueve permisos, tres por bloque, y el sello de aprobado encima. Los cuadros
 * llenos son los concedidos y los huecos los que faltan, que es exactamente lo
 * que el estudiante tiene que corregir.
 */
export function SimulatorPermissionsIllustration() {
  // Rejilla de 3x3: cada fila es un bloque (dueño, grupo, otros).
  const filas = [
    [true, true, true],
    [true, false, true],
    [false, false, false],
  ]
  return (
    <Svg>
      {/* la hoja, con la esquina doblada */}
      <path d="M56 14 h58 l22 22 v68 h-80 Z" stroke={LINE} strokeWidth="2" />
      <path d="M114 14 v22 h22" stroke={BASE} strokeWidth="1.6" />

      {filas.map((fila, f) =>
        fila.map((puesto, c) => (
          <rect
            key={`${f}-${c}`}
            x={70 + c * 18}
            y={46 + f * 18}
            width={12}
            height={12}
            rx={2.5}
            fill={puesto ? BASE : "none"}
            stroke={puesto ? BASE : BASE}
            strokeWidth="1.6"
            opacity={puesto ? 1 : 0.45}
          />
        )),
      )}

      {/* el sello, pisando el borde de la hoja */}
      <circle cx={148} cy={86} r={19} stroke={RED} strokeWidth="2.5" />
      <path d="M139 86 l6 7 l12 -14" stroke={RED} strokeWidth="3" />
    </Svg>
  )
}
