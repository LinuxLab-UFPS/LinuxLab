/**
 * Una ilustracion por cada trabajo del kernel, para la leccion 02-kernel.
 *
 * Salvo la de procesos —que dibuja una ventana, y una ventana tiene su propio
 * marco—, los diagramas van sin fondo: se apoyan en el de la pagina como el
 * arbol de directorios (`filesystem-hierarchy.tsx`) o el diagrama de espacios.
 * Sus colores salen de los tokens del tema, no de valores fijos, para que la
 * misma figura se lea en claro y en oscuro; antes eran pasteles sobre una
 * tarjeta oscura y en modo claro habrian quedado lavadisimos.
 */

const W = 820
const SURFACE = "#1a1d24"
const BORDER = "rgba(255,255,255,0.30)"
const INK = "#c9d1d9"
const MUTED = "#8b949e"
const SKY = "#7dd3fc"
const AMBER = "#fbbf24"
const GREEN = "#86efac"
const RED = "#ff5470"
const MONO = "var(--font-geist-mono), ui-monospace, monospace"

/* Paleta de los diagramas, la misma del arbol de directorios: un tono por idea
   y dos intensidades, la mas oscura para el tema claro. */
const TRAZO = "stroke-muted-foreground/50"
const TEXTO = "fill-foreground"
const APUNTE = "fill-muted-foreground"
const AZUL_TEXTO = "fill-sky-600 dark:fill-sky-400"
const VERDE_TEXTO = "fill-emerald-600 dark:fill-emerald-400"

/** El marco comun: una tarjeta oscura del ancho del contenido. */
function Card({
  id,
  title,
  height,
  children,
}: {
  id: string
  title: string
  height: number
  children: React.ReactNode
}) {
  return (
    <svg
      viewBox={`0 0 ${W + 4} ${height + 4}`}
      role="img"
      aria-labelledby={id}
      className="mx-auto my-8 block w-full max-w-3xl"
    >
      <title id={id}>{title}</title>
      <g transform="translate(2, 2)">
        <rect
          width={W}
          height={height}
          rx="14"
          fill={SURFACE}
          stroke={BORDER}
          strokeWidth="1.8"
        />
        {children}
      </g>
    </svg>
  )
}

/** Un diagrama sin marco, directamente sobre la pagina. */
function Diagram({
  id,
  title,
  height,
  children,
}: {
  id: string
  title: string
  height: number
  children: React.ReactNode
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-labelledby={id}
      className="mx-auto my-8 block w-full max-w-3xl"
    >
      <title id={id}>{title}</title>
      {children}
    </svg>
  )
}

/**
 * Rotulo en monoespaciada. El color va por `className` (token del tema) en los
 * diagramas y por `fill` en la ventana de procesos, que es de color fijo.
 */
function Label({
  x,
  y,
  children,
  fill,
  className,
  size = 14,
  anchor = "start",
}: {
  x: number
  y: number
  children: string
  fill?: string
  className?: string
  size?: number
  anchor?: "start" | "middle" | "end"
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={className ? undefined : (fill ?? MUTED)}
      className={className}
      textAnchor={anchor}
      fontFamily={MONO}
    >
      {children}
    </text>
  )
}

/* ============================================================
   1. Gestion de procesos
   ============================================================ */

/** Curva de consumo de un proceso: los picos son el uso de CPU en el tiempo. */
function Wave({
  x,
  y,
  width,
  height,
  color,
  peaks,
}: {
  x: number
  y: number
  width: number
  height: number
  color: string
  peaks: number[]
}) {
  const step = width / (peaks.length - 1)
  const points = peaks.map((p, i) => `${x + i * step},${y + height - p * height}`)
  const line = `M${points.join(" L")}`
  return (
    <g>
      <path d={`${line} L${x + width},${y + height} L${x},${y + height} Z`} fill={color} opacity="0.16" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </g>
  )
}

const PROCESSES = [
  {
    name: "navegador",
    color: SKY,
    peaks: [0.1, 0.2, 0.15, 0.55, 0.3, 0.2, 0.75, 0.4, 0.25, 0.3, 0.6, 0.35, 0.2, 0.45, 0.85, 0.4, 0.2, 0.3],
  },
  {
    name: "editor",
    color: GREEN,
    peaks: [0.15, 0.1, 0.3, 0.2, 0.12, 0.4, 0.2, 0.15, 0.5, 0.25, 0.15, 0.2, 0.35, 0.2, 0.15, 0.45, 0.25, 0.15],
  },
  {
    name: "terminal",
    color: RED,
    peaks: [0.08, 0.12, 0.1, 0.08, 0.35, 0.12, 0.1, 0.15, 0.1, 0.4, 0.15, 0.1, 0.12, 0.3, 0.1, 0.08, 0.2, 0.1],
  },
  {
    name: "reproductor",
    color: AMBER,
    peaks: [0.3, 0.35, 0.28, 0.33, 0.3, 0.36, 0.29, 0.32, 0.34, 0.3, 0.28, 0.35, 0.31, 0.29, 0.33, 0.3, 0.34, 0.3],
  },
]

/** Icono de cada aplicacion. */
function AppGlyph({ x, y, kind, color }: { x: number; y: number; kind: string; color: string }) {
  const cx = x + 18
  const cy = y + 18
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="36"
        height="36"
        rx="9"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.14)"
      />
      {kind === "navegador" && (
        <g stroke={color} strokeWidth="1.5" fill="none">
          <circle cx={cx} cy={cy} r="10" />
          <ellipse cx={cx} cy={cy} rx="4.2" ry="10" />
          <path d={`M${cx - 10} ${cy} H${cx + 10}`} />
        </g>
      )}
      {kind === "editor" && (
        <text x={cx} y={cy + 5} fontSize="13" fill={color} textAnchor="middle" fontFamily={MONO}>
          {"</>"}
        </text>
      )}
      {kind === "terminal" && (
        <text x={cx} y={cy + 5} fontSize="13" fill={color} textAnchor="middle" fontFamily={MONO}>
          {">_"}
        </text>
      )}
      {kind === "reproductor" && (
        <path d={`M${cx - 6} ${cy - 8} L${cx + 8} ${cy} L${cx - 6} ${cy + 8} Z`} fill={color} />
      )}
    </g>
  )
}

export function KernelProcesosIllustration() {
  return (
    <Card
      id="ilu-kernel-procesos"
      title="Cuatro aplicaciones abiertas a la vez, cada una con su curva de consumo de CPU"
      height={344}
    >
      <path d="M0 46 H820" stroke="rgba(255,255,255,0.16)" />
      <circle cx="26" cy="23" r="7" fill="#ff5f57" />
      <circle cx="48" cy="23" r="7" fill="#febc2e" />
      <circle cx="70" cy="23" r="7" fill="#28c840" />
      <Label x={410} y={28} anchor="middle">
        procesos en ejecución
      </Label>

      {PROCESSES.map((process, i) => {
        const y = 74 + i * 66
        return (
          <g key={process.name}>
            <AppGlyph x={22} y={y} kind={process.name} color={process.color} />
            <Label x={70} y={y + 24} fill={INK} size={15}>
              {process.name}
            </Label>

            <rect
              x="212"
              y={y - 6}
              width="586"
              height="48"
              rx="6"
              fill="#0d1117"
              opacity="0.55"
            />
            <Wave
              x={222}
              y={y + 2}
              width={566}
              height={32}
              color={process.color}
              peaks={process.peaks}
            />
          </g>
        )
      })}
    </Card>
  )
}

/* ============================================================
   2. Gestion de memoria
   ============================================================ */

/** Que proceso ocupa cada celda de la RAM. `null` es memoria libre. */
const RAM_CELLS: ("navegador" | "editor" | null)[] = [
  "navegador", "navegador", "navegador",
  null,
  "editor", "editor",
  null,
  "navegador", "navegador",
  "editor", "editor", "editor",
  null,
  "navegador",
  null,
]

/**
 * La celda ocupada va con su color a plena intensidad y la libre en un gris
 * medio: tiene que leerse como "aqui no hay nada", no como un hueco negro.
 */
const CELDA = {
  navegador: "fill-sky-500/70 stroke-sky-500",
  editor: "fill-emerald-500/70 stroke-emerald-500",
  libre: "fill-muted-foreground/20 stroke-muted-foreground/45",
}

export function KernelMemoriaIllustration() {
  return (
    <Diagram
      id="ilu-kernel-memoria"
      title="Cada proceso cree tener un bloque continuo de memoria, mientras que en la RAM sus datos estan repartidos en celdas sueltas"
      height={190}
    >
      <Label x={4} y={20} size={13} className={APUNTE}>
        lo que cree tener cada proceso
      </Label>
      <rect
        x="4"
        y="32"
        width="392"
        height="42"
        rx="9"
        className="fill-sky-500/15 stroke-sky-500"
        strokeWidth="2"
      />
      <Label x={26} y={59} size={15} className={AZUL_TEXTO}>
        navegador
      </Label>
      <rect
        x="416"
        y="32"
        width="300"
        height="42"
        rx="9"
        className="fill-emerald-500/15 stroke-emerald-500"
        strokeWidth="2"
      />
      <Label x={438} y={59} size={15} className={VERDE_TEXTO}>
        editor
      </Label>

      <Label x={4} y={124} size={13} className={APUNTE}>
        cómo queda de verdad en la RAM
      </Label>
      {RAM_CELLS.map((owner, i) => (
        <rect
          key={i}
          x={4 + i * 52}
          y="138"
          width="44"
          height="36"
          rx="7"
          className={CELDA[owner ?? "libre"]}
          strokeWidth="1.8"
        />
      ))}
    </Diagram>
  )
}

/* ============================================================
   3. Sistema de archivos
   ============================================================ */

/** Carpeta del arbol de directorios. */
function Folder({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y + 4} h10 l4 5 h16 a3 3 0 0 1 3 3 v13 a3 3 0 0 1 -3 3 h-30 a3 3 0 0 1 -3 -3 v-18 a3 3 0 0 1 3 -3 z`}
      className="fill-sky-500"
    />
  )
}

const TREE = [
  { x: 28, y: 20, name: "/", detail: "la raíz: todo cuelga de aquí" },
  { x: 150, y: 98, name: "etc/", detail: "la configuración del sistema" },
  { x: 150, y: 168, name: "home/", detail: "los archivos de cada usuario" },
  { x: 150, y: 238, name: "dev/", detail: "los dispositivos conectados" },
]

export function KernelArchivosIllustration() {
  return (
    <Diagram
      id="ilu-kernel-archivos"
      title="El arbol de directorios: una sola raiz de la que cuelgan etc, home y dev, donde hasta el disco aparece como un archivo"
      height={330}
    >
      {/* Tronco desde la raiz y codos hacia cada carpeta */}
      <g className={TRAZO} strokeWidth="2" fill="none">
        <path d="M46 58 V242" />
        <path d="M46 102 H144" />
        <path d="M46 172 H144" />
        <path d="M46 242 H144" />
        <path d="M168 276 V306 H276" />
      </g>

      {TREE.map((node) => (
        <g key={node.name}>
          <Folder x={node.x} y={node.y} />
          <Label x={node.x + 46} y={node.y + 22} className={TEXTO} size={16}>
            {node.name}
          </Label>
          <Label x={node.x + 150} y={node.y + 22} size={13} className={APUNTE}>
            {node.detail}
          </Label>
        </g>
      ))}

      {/* El disco, colgando de dev/ */}
      <g>
        <rect
          x="280"
          y="292"
          width="30"
          height="28"
          rx="5"
          fill="none"
          className="stroke-emerald-500"
          strokeWidth="2"
        />
        <path
          d="M286 300 H304 M286 306 H304 M286 312 H298"
          className="stroke-emerald-500"
          strokeWidth="1.8"
        />
        <Label x={324} y={312} className={VERDE_TEXTO} size={16}>
          sda
        </Label>
        <Label x={400} y={312} size={13} className={APUNTE}>
          el disco duro, visto como un archivo más
        </Label>
      </g>
    </Diagram>
  )
}

/* ============================================================
   4. Gestion de dispositivos
   ============================================================ */

const DEVICES = [
  { cx: 130, name: "teclado" },
  { cx: 310, name: "ratón" },
  { cx: 490, name: "pantalla" },
  { cx: 670, name: "disco" },
]

function DeviceGlyph({ cx, name }: { cx: number; name: string }) {
  return (
    <g>
      <rect
        x={cx - 34}
        y="38"
        width="68"
        height="60"
        rx="12"
        className="fill-muted/60 stroke-muted-foreground/30"
        strokeWidth="1.5"
      />
      <g className="stroke-sky-500" strokeWidth="1.9" fill="none">
        {name === "teclado" && (
          <>
            <rect x={cx - 20} y="56" width="40" height="24" rx="4" />
            <path d={`M${cx - 15} 64 h6 M${cx - 5} 64 h6 M${cx + 5} 64 h6 M${cx - 10} 73 h20`} />
          </>
        )}
        {name === "ratón" && (
          <>
            <rect x={cx - 11} y="54" width="22" height="30" rx="11" />
            <path d={`M${cx} 58 v8`} />
          </>
        )}
        {name === "pantalla" && (
          <>
            <rect x={cx - 22} y="54" width="44" height="26" rx="3" />
            <path d={`M${cx} 80 v6 M${cx - 9} 86 h18`} />
          </>
        )}
        {name === "disco" && (
          <>
            <ellipse cx={cx} cy="60" rx="20" ry="7" />
            <path d={`M${cx - 20} 60 v16 a20 7 0 0 0 40 0 v-16`} />
          </>
        )}
      </g>
      <Label x={cx} y={118} anchor="middle" size={13} className={APUNTE}>
        {name}
      </Label>
    </g>
  )
}

export function KernelDispositivosIllustration() {
  return (
    <Diagram
      id="ilu-kernel-dispositivos"
      title="Cada dispositivo habla con el kernel a traves de su propio controlador"
      height={286}
    >
      {DEVICES.map((device) => (
        <g key={device.name}>
          <DeviceGlyph cx={device.cx} name={device.name} />
          <path d={`M${device.cx} 128 V158`} className={TRAZO} strokeWidth="2" />
          <rect
            x={device.cx - 56}
            y="158"
            width="112"
            height="32"
            rx="8"
            className="fill-sky-500/10 stroke-sky-500/70"
            strokeWidth="1.6"
          />
          <Label x={device.cx} y={179} anchor="middle" className={AZUL_TEXTO} size={13}>
            controlador
          </Label>
          <path d={`M${device.cx} 190 V222`} className={TRAZO} strokeWidth="2" />
        </g>
      ))}

      <rect
        x="60"
        y="222"
        width="700"
        height="48"
        rx="10"
        className="fill-primary/10 stroke-primary"
        strokeWidth="2"
      />
      <Label x={410} y={252} anchor="middle" className="fill-primary" size={17}>
        kernel
      </Label>
    </Diagram>
  )
}

/* ============================================================
   5. Comunicacion de red
   ============================================================ */

export function KernelRedIllustration() {
  return (
    <Diagram
      id="ilu-kernel-red"
      title="El equipo intercambia paquetes con internet siguiendo los protocolos de red"
      height={230}
    >
      {/* Tu equipo */}
      <rect
        x="24"
        y="52"
        width="210"
        height="112"
        rx="12"
        className="fill-muted/60 stroke-muted-foreground/30"
        strokeWidth="1.5"
      />
      <Label x={129} y={82} anchor="middle" className={TEXTO} size={15}>
        tu equipo
      </Label>
      <rect
        x="54"
        y="98"
        width="150"
        height="30"
        rx="7"
        className="fill-sky-500/10 stroke-sky-500/70"
        strokeWidth="1.6"
      />
      <Label x={129} y={118} anchor="middle" className={AZUL_TEXTO} size={13}>
        192.168.1.42
      </Label>

      {/* Los paquetes van y vuelven */}
      <g>
        <path d="M250 90 H598" className={TRAZO} strokeWidth="1.8" strokeDasharray="6 6" />
        <path d="M598 90 L586 84 L586 96 Z" className="fill-muted-foreground/70" />
        <rect x="304" y="84" width="14" height="14" rx="3" className="fill-sky-500" />
        <rect x="394" y="84" width="14" height="14" rx="3" className="fill-sky-500/75" />
        <rect x="484" y="84" width="14" height="14" rx="3" className="fill-sky-500/50" />

        <path d="M598 138 H250" className={TRAZO} strokeWidth="1.8" strokeDasharray="6 6" />
        <path d="M250 138 L262 132 L262 144 Z" className="fill-muted-foreground/70" />
        <rect x="324" y="132" width="14" height="14" rx="3" className="fill-emerald-500/50" />
        <rect x="414" y="132" width="14" height="14" rx="3" className="fill-emerald-500/75" />
        <rect x="504" y="132" width="14" height="14" rx="3" className="fill-emerald-500" />

        <Label x={424} y={120} anchor="middle" size={13} className={APUNTE}>
          paquetes · TCP/IP
        </Label>
      </g>

      {/* La red, al otro lado */}
      <g>
        <g className="stroke-sky-500" strokeWidth="1.9" fill="none">
          <circle cx="684" cy="108" r="44" />
          <ellipse cx="684" cy="108" rx="18" ry="44" />
          <path d="M640 108 H728 M648 84 H720 M648 132 H720" />
        </g>
        <Label x={684} y={182} anchor="middle" size={13} className={APUNTE}>
          otros computadores
        </Label>
      </g>
    </Diagram>
  )
}
