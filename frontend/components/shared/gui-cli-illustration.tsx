/**
 * Las dos formas de hablarle al sistema, dibujadas: una ventana de terminal
 * detras y un escritorio con su dock delante. Va en SVG y no como imagen para
 * que escale sin pesar, se lea igual en cualquier pantalla y siga la paleta de
 * la plataforma en vez de una captura de un escritorio ajeno.
 *
 * Las lineas de la terminal son barras y no texto a proposito: representan
 * ordenes escritas — el prompt en rojo y lo que responde el sistema en gris —
 * sin obligar a leer un comando concreto que la leccion aun no ha explicado.
 */
export function GuiCliIllustration() {
  return (
    <svg
      viewBox="0 0 1120 580"
      role="img"
      aria-labelledby="gui-cli-title"
      className="mx-auto my-8 block w-full"
    >
      <title id="gui-cli-title">
        Una ventana de terminal con lineas de comandos y, delante, un escritorio
        grafico con su barra de aplicaciones
      </title>

      <defs>
        {/* Fondo del escritorio: del azul oscuro de la interfaz al rojo de la marca. */}
        <linearGradient id="gui-cli-desktop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#151a24" />
          <stop offset="1" stopColor="#1d2233" />
        </linearGradient>
        <linearGradient id="gui-cli-band-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#241a2b" />
          <stop offset="1" stopColor="#3d1d34" />
        </linearGradient>
        <linearGradient id="gui-cli-band-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f1b32" />
          <stop offset="1" stopColor="#7d1e39" />
        </linearGradient>
        <linearGradient id="gui-cli-band-3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a01d36" />
          <stop offset="1" stopColor="#c41e3a" />
        </linearGradient>

        <clipPath id="gui-cli-screen">
          <rect x="470" y="190" width="630" height="366" rx="16" />
        </clipPath>
      </defs>

      {/* ---------- Ventana de terminal ---------- */}
      <g>
        <rect
          x="24"
          y="24"
          width="660"
          height="380"
          rx="14"
          fill="#1a1d24"
          stroke="rgba(255,255,255,0.30)"
          strokeWidth="1.8"
        />
        <path d="M24 70 H684" stroke="rgba(255,255,255,0.16)" />

        {/* Semaforo y titulo de la ventana */}
        <circle cx="56" cy="47" r="7.5" fill="#ff5f57" />
        <circle cx="80" cy="47" r="7.5" fill="#febc2e" />
        <circle cx="104" cy="47" r="7.5" fill="#28c840" />
        <text
          x="354"
          y="52"
          textAnchor="middle"
          fontSize="15"
          fill="#8b949e"
          fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        >
          student@linuxlab: ~
        </text>

        {/* Ordenes escritas (prompt rojo + linea) y respuestas del sistema (gris) */}
        <g>
          <rect x="52" y="104" width="54" height="16" rx="4" fill="#c41e3a" />
          <rect x="120" y="104" width="132" height="16" rx="4" fill="#c9d1d9" opacity="0.75" />

          <rect x="72" y="140" width="300" height="16" rx="4" fill="#6e7681" opacity="0.75" />

          <rect x="52" y="184" width="54" height="16" rx="4" fill="#c41e3a" />
          <rect x="120" y="184" width="248" height="16" rx="4" fill="#c9d1d9" opacity="0.75" />

          <rect x="72" y="220" width="212" height="16" rx="4" fill="#6e7681" opacity="0.75" />
          <rect x="72" y="252" width="330" height="16" rx="4" fill="#6e7681" opacity="0.75" />

          <rect x="52" y="296" width="54" height="16" rx="4" fill="#c41e3a" />
          <rect x="120" y="296" width="96" height="16" rx="4" fill="#c9d1d9" opacity="0.75" />
          {/* El cursor: en la terminal se escribe, no se hace clic */}
          <rect x="226" y="296" width="13" height="16" rx="2" fill="#ff5470" />
        </g>
      </g>

      {/* ---------- Escritorio grafico ---------- */}
      <g>
        <g clipPath="url(#gui-cli-screen)">
          <rect x="470" y="190" width="630" height="366" fill="url(#gui-cli-desktop)" />
          <path d="M470 330 L785 268 L1100 336 L1100 556 L470 556 Z" fill="url(#gui-cli-band-1)" />
          <path d="M470 404 L785 342 L1100 410 L1100 556 L470 556 Z" fill="url(#gui-cli-band-2)" />
          <path d="M470 478 L785 416 L1100 484 L1100 556 L470 556 Z" fill="url(#gui-cli-band-3)" />
        </g>
        <rect
          x="470"
          y="190"
          width="630"
          height="366"
          rx="16"
          fill="none"
          stroke="rgba(255,255,255,0.30)"
          strokeWidth="1.8"
        />

        {/* Barra de aplicaciones */}
        <g>
          {/* La barra cae sobre la banda roja, asi que va bien oscura: es lo que
              mantiene legibles los iconos encima del degradado. */}
          <rect
            x="650"
            y="476"
            width="270"
            height="56"
            rx="18"
            fill="#0d1117"
            opacity="0.78"
          />
          <rect
            x="650"
            y="476"
            width="270"
            height="56"
            rx="18"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
          />

          <AppTile x={666} />
          <AppTile x={716} />
          <AppTile x={766} />
          <AppTile x={816} />
          <AppTile x={866} />

          {/* Navegador */}
          <g stroke="#7dd3fc" strokeWidth="1.6" fill="none">
            <circle cx="685" cy="504" r="11" />
            <ellipse cx="685" cy="504" rx="4.6" ry="11" />
            <path d="M674 504 H696" />
          </g>
          {/* Documento */}
          <g stroke="#fbbf24" strokeWidth="1.6" fill="none">
            <rect x="727" y="493" width="16" height="22" rx="2.5" />
            <path d="M731 499 H739 M731 504 H739 M731 509 H736" />
          </g>
          {/* Editor de codigo */}
          <text
            x="785"
            y="510"
            textAnchor="middle"
            fontSize="15"
            fill="#86efac"
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
          >
            {"</>"}
          </text>
          {/* Terminal */}
          <text
            x="835"
            y="510"
            textAnchor="middle"
            fontSize="15"
            fill="#e6edf3"
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
          >
            {">_"}
          </text>
          {/* Reproductor */}
          <path d="M879 494 L897 504 L879 514 Z" fill="#c9d1d9" />
        </g>

        {/* El puntero: en el escritorio se hace clic */}
        <g transform="translate(942, 402)">
          <path
            d="M0 0 L0 26 L6.5 20 L11 30 L16 27.5 L11.5 18 L20 17 Z"
            fill="#ffffff"
            stroke="rgba(0,0,0,0.45)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  )
}

/** El cuadro de fondo de cada icono del dock. */
function AppTile({ x }: { x: number }) {
  return (
    <rect
      x={x}
      y={485}
      width="38"
      height="38"
      rx="10"
      fill="rgba(255,255,255,0.10)"
      stroke="rgba(255,255,255,0.14)"
    />
  )
}
