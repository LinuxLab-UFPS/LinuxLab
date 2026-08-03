/**
 * Las ilustraciones de las lecciones, en SVG y no como imagen: escalan sin
 * pesar, se leen igual en cualquier pantalla y siguen la paleta de la
 * plataforma en vez de arrastrar el escritorio, el tema y la distro de la
 * captura de otra persona.
 *
 * Hay dos piezas, la ventana de terminal y la pantalla de escritorio, y tres
 * ilustraciones que las combinan. Cada pieza se dibuja en su propio origen y
 * quien la usa la coloca con un translate.
 *
 * Se insertan en el material con `<!-- ILLUSTRATION: id -->` (ver
 * lesson-blocks.ts), donde id es una de las claves de LESSON_ILLUSTRATIONS.
 */

const TERMINAL_W = 660
const TERMINAL_H = 380
const DESKTOP_W = 630
const DESKTOP_H = 366

/**
 * Una ventana de terminal. Las lineas son barras y no texto a proposito:
 * representan ordenes escritas — el prompt en rojo y lo que responde el
 * sistema en gris — sin obligar a leer un comando que la leccion aun no ha
 * explicado.
 */
function TerminalWindow() {
  return (
    <g>
      <rect
        width={TERMINAL_W}
        height={TERMINAL_H}
        rx="14"
        fill="#1a1d24"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="1.8"
      />
      <path d="M0 46 H660" stroke="rgba(255,255,255,0.16)" />

      {/* Semaforo y titulo de la ventana */}
      <circle cx="32" cy="23" r="7.5" fill="#ff5f57" />
      <circle cx="56" cy="23" r="7.5" fill="#febc2e" />
      <circle cx="80" cy="23" r="7.5" fill="#28c840" />
      <text
        x="330"
        y="28"
        textAnchor="middle"
        fontSize="15"
        fill="#8b949e"
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
      >
        student@linuxlab: ~
      </text>

      <rect x="28" y="80" width="54" height="16" rx="4" fill="#c41e3a" />
      <rect x="96" y="80" width="132" height="16" rx="4" fill="#c9d1d9" opacity="0.75" />

      <rect x="48" y="116" width="300" height="16" rx="4" fill="#6e7681" opacity="0.75" />

      <rect x="28" y="160" width="54" height="16" rx="4" fill="#c41e3a" />
      <rect x="96" y="160" width="248" height="16" rx="4" fill="#c9d1d9" opacity="0.75" />

      <rect x="48" y="196" width="212" height="16" rx="4" fill="#6e7681" opacity="0.75" />
      <rect x="48" y="228" width="330" height="16" rx="4" fill="#6e7681" opacity="0.75" />

      <rect x="28" y="272" width="54" height="16" rx="4" fill="#c41e3a" />
      <rect x="96" y="272" width="96" height="16" rx="4" fill="#c9d1d9" opacity="0.75" />
      {/* El cursor: en la terminal se escribe, no se hace clic */}
      <rect x="202" y="272" width="13" height="16" rx="2" fill="#ff5470" />
    </g>
  )
}

/** Los degradados y el recorte del escritorio, con id propio por ilustracion. */
function DesktopDefs({ id }: { id: string }) {
  return (
    <defs>
      {/* Del azul oscuro de la interfaz al rojo de la marca */}
      <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#151a24" />
        <stop offset="1" stopColor="#1d2233" />
      </linearGradient>
      <linearGradient id={`${id}-band-1`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#241a2b" />
        <stop offset="1" stopColor="#3d1d34" />
      </linearGradient>
      <linearGradient id={`${id}-band-2`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4f1b32" />
        <stop offset="1" stopColor="#7d1e39" />
      </linearGradient>
      <linearGradient id={`${id}-band-3`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#a01d36" />
        <stop offset="1" stopColor="#c41e3a" />
      </linearGradient>
      <clipPath id={`${id}-screen`}>
        <rect width={DESKTOP_W} height={DESKTOP_H} rx="16" />
      </clipPath>
    </defs>
  )
}

/**
 * Una pantalla de escritorio: panel arriba, una ventana abierta, la barra de
 * aplicaciones abajo y el puntero. Es la capa visual que describe la leccion,
 * sobre un degradado hecho con la paleta oscura de la plataforma.
 */
function DesktopScreen({ id }: { id: string }) {
  return (
    <g>
      <g clipPath={`url(#${id}-screen)`}>
        <rect width={DESKTOP_W} height={DESKTOP_H} fill={`url(#${id}-bg)`} />
        <path d="M0 140 L315 78 L630 146 L630 366 L0 366 Z" fill={`url(#${id}-band-1)`} />
        <path d="M0 214 L315 152 L630 220 L630 366 L0 366 Z" fill={`url(#${id}-band-2)`} />
        <path d="M0 288 L315 226 L630 294 L630 366 L0 366 Z" fill={`url(#${id}-band-3)`} />

        {/* Panel superior */}
        <rect width={DESKTOP_W} height="26" fill="#0d1117" opacity="0.55" />
        <rect x="12" y="8" width="13" height="10" rx="2.5" fill="rgba(255,255,255,0.5)" />
        <rect x="556" y="9" width="26" height="8" rx="4" fill="rgba(255,255,255,0.35)" />
        <rect x="590" y="9" width="24" height="8" rx="4" fill="rgba(255,255,255,0.35)" />

        {/* Una ventana abierta */}
        <g>
          <rect
            x="54"
            y="66"
            width="252"
            height="152"
            rx="10"
            fill="#161b22"
            opacity="0.94"
            stroke="rgba(255,255,255,0.24)"
          />
          <path d="M54 96 H306" stroke="rgba(255,255,255,0.18)" />
          <circle cx="70" cy="81" r="4.5" fill="rgba(255,255,255,0.35)" />
          <circle cx="84" cy="81" r="4.5" fill="rgba(255,255,255,0.35)" />
          <circle cx="98" cy="81" r="4.5" fill="rgba(255,255,255,0.35)" />
          <rect x="70" y="112" width="150" height="10" rx="3" fill="rgba(255,255,255,0.28)" />
          <rect x="70" y="132" width="200" height="10" rx="3" fill="rgba(255,255,255,0.18)" />
          <rect x="70" y="152" width="118" height="10" rx="3" fill="rgba(255,255,255,0.18)" />
          <rect x="70" y="172" width="172" height="10" rx="3" fill="rgba(255,255,255,0.18)" />
        </g>
      </g>

      <rect
        width={DESKTOP_W}
        height={DESKTOP_H}
        rx="16"
        fill="none"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="1.8"
      />

      {/* Barra de aplicaciones. Cae sobre la banda roja, asi que va bien oscura:
          es lo que mantiene legibles los iconos encima del degradado. */}
      <g>
        <rect x="180" y="286" width="270" height="56" rx="18" fill="#0d1117" opacity="0.78" />
        <rect
          x="180"
          y="286"
          width="270"
          height="56"
          rx="18"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
        />

        <AppTile x={196} />
        <AppTile x={246} />
        <AppTile x={296} />
        <AppTile x={346} />
        <AppTile x={396} />

        {/* Navegador */}
        <g stroke="#7dd3fc" strokeWidth="1.6" fill="none">
          <circle cx="215" cy="314" r="11" />
          <ellipse cx="215" cy="314" rx="4.6" ry="11" />
          <path d="M204 314 H226" />
        </g>
        {/* Documento */}
        <g stroke="#fbbf24" strokeWidth="1.6" fill="none">
          <rect x="257" y="303" width="16" height="22" rx="2.5" />
          <path d="M261 309 H269 M261 314 H269 M261 319 H266" />
        </g>
        {/* Editor de codigo */}
        <text
          x="315"
          y="320"
          textAnchor="middle"
          fontSize="15"
          fill="#86efac"
          fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        >
          {"</>"}
        </text>
        {/* Terminal */}
        <text
          x="365"
          y="320"
          textAnchor="middle"
          fontSize="15"
          fill="#e6edf3"
          fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        >
          {">_"}
        </text>
        {/* Reproductor */}
        <path d="M409 304 L427 314 L409 324 Z" fill="#c9d1d9" />
      </g>

      {/* El puntero: en el escritorio se hace clic */}
      <g transform="translate(472, 212)">
        <path
          d="M0 0 L0 26 L6.5 20 L11 30 L16 27.5 L11.5 18 L20 17 Z"
          fill="#ffffff"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </g>
    </g>
  )
}

/** El cuadro de fondo de cada icono de la barra de aplicaciones. */
function AppTile({ x }: { x: number }) {
  return (
    <rect
      x={x}
      y="295"
      width="38"
      height="38"
      rx="10"
      fill="rgba(255,255,255,0.10)"
      stroke="rgba(255,255,255,0.14)"
    />
  )
}

/** Las dos formas de hablarle al sistema, una al lado de la otra. */
export function GuiCliIllustration() {
  return (
    <svg
      viewBox="0 0 1120 580"
      role="img"
      aria-labelledby="ilu-gui-cli"
      className="mx-auto my-8 block w-full"
    >
      <title id="ilu-gui-cli">
        Una ventana de terminal con lineas de comandos y, delante, un escritorio
        grafico con su barra de aplicaciones
      </title>
      <DesktopDefs id="ilu-gui-cli" />
      <g transform="translate(24, 24)">
        <TerminalWindow />
      </g>
      <g transform="translate(470, 190)">
        <DesktopScreen id="ilu-gui-cli" />
      </g>
    </svg>
  )
}

/** Solo la terminal, para la leccion de la linea de comandos. */
export function TerminalIllustration() {
  return (
    <svg
      viewBox={`0 0 ${TERMINAL_W + 4} ${TERMINAL_H + 4}`}
      role="img"
      aria-labelledby="ilu-terminal"
      className="mx-auto my-8 block w-full max-w-2xl"
    >
      <title id="ilu-terminal">
        Una ventana de terminal con varias ordenes escritas y sus respuestas
      </title>
      <g transform="translate(2, 2)">
        <TerminalWindow />
      </g>
    </svg>
  )
}

/** Solo el escritorio, para la leccion de entornos de ventanas. */
export function DesktopIllustration() {
  return (
    <svg
      viewBox={`0 0 ${DESKTOP_W + 4} ${DESKTOP_H + 4}`}
      role="img"
      aria-labelledby="ilu-desktop"
      className="mx-auto my-8 block w-full max-w-2xl"
    >
      <title id="ilu-desktop">
        Un escritorio grafico con su panel, una ventana abierta y la barra de
        aplicaciones
      </title>
      <DesktopDefs id="ilu-desktop" />
      <g transform="translate(2, 2)">
        <DesktopScreen id="ilu-desktop" />
      </g>
    </svg>
  )
}

/** Lo que puede pedir un `<!-- ILLUSTRATION: id -->` desde una leccion. */
export const LESSON_ILLUSTRATIONS: Record<string, () => React.JSX.Element> = {
  "gui-cli": GuiCliIllustration,
  terminal: TerminalIllustration,
  desktop: DesktopIllustration,
}
