/**
 * Una ilustracion por cada trabajo del kernel, para la leccion 02-kernel.
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

/** Rotulo en monoespaciada. */
function Label({
  x,
  y,
  children,
  fill = MUTED,
  size = 14,
  anchor = "start",
}: {
  x: number
  y: number
  children: string
  fill?: string
  size?: number
  anchor?: "start" | "middle" | "end"
}) {
  return (
    <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} fontFamily={MONO}>
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
const RAM_CELLS: (string | null)[] = [
  SKY, SKY, SKY,
  null,
  AMBER, AMBER,
  null,
  SKY, SKY,
  AMBER, AMBER, AMBER,
  null,
  SKY,
  null,
]

export function KernelMemoriaIllustration() {
  return (
    <Card
      id="ilu-kernel-memoria"
      title="Cada proceso cree tener un bloque continuo de memoria, mientras que en la RAM sus datos estan repartidos en celdas sueltas"
      height={210}
    >
      <Label x={24} y={34} size={13}>
        lo que cree tener cada proceso
      </Label>
      <rect
        x="24"
        y="46"
        width="360"
        height="38"
        rx="8"
        fill={SKY}
        fillOpacity="0.16"
        stroke={SKY}
        strokeOpacity="0.8"
      />
      <Label x={40} y={70} fill={SKY}>
        navegador
      </Label>
      <rect
        x="404"
        y="46"
        width="280"
        height="38"
        rx="8"
        fill={AMBER}
        fillOpacity="0.16"
        stroke={AMBER}
        strokeOpacity="0.8"
      />
      <Label x={420} y={70} fill={AMBER}>
        editor
      </Label>

      <Label x={24} y={132} size={13}>
        cómo queda de verdad en la RAM
      </Label>
      {RAM_CELLS.map((owner, i) => (
        <rect
          key={i}
          x={24 + i * 52}
          y="146"
          width="44"
          height="34"
          rx="6"
          fill={owner ?? "#ffffff"}
          fillOpacity={owner ? 0.38 : 0.04}
          stroke={owner ?? "#ffffff"}
          strokeOpacity={owner ? 0.85 : 0.14}
          strokeWidth="1.4"
        />
      ))}
    </Card>
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
      fill={SKY}
      opacity="0.85"
    />
  )
}

const TREE = [
  { x: 48, y: 40, name: "/", detail: "la raíz: todo cuelga de aquí" },
  { x: 170, y: 118, name: "etc/", detail: "la configuración del sistema" },
  { x: 170, y: 188, name: "home/", detail: "los archivos de cada usuario" },
  { x: 170, y: 258, name: "dev/", detail: "los dispositivos conectados" },
]

export function KernelArchivosIllustration() {
  return (
    <Card
      id="ilu-kernel-archivos"
      title="El arbol de directorios: una sola raiz de la que cuelgan etc, home y dev, donde hasta el disco aparece como un archivo"
      height={370}
    >
      {/* Tronco desde la raiz y codos hacia cada carpeta */}
      <g stroke="rgba(255,255,255,0.25)" strokeWidth="1.6" fill="none">
        <path d="M66 78 V262" />
        <path d="M66 122 H164" />
        <path d="M66 192 H164" />
        <path d="M66 262 H164" />
        <path d="M188 296 V326 H296" />
      </g>

      {TREE.map((node) => (
        <g key={node.name}>
          <Folder x={node.x} y={node.y} />
          <Label x={node.x + 46} y={node.y + 22} fill={INK} size={16}>
            {node.name}
          </Label>
          <Label x={node.x + 150} y={node.y + 22} size={13}>
            {node.detail}
          </Label>
        </g>
      ))}

      {/* El disco, colgando de dev/ */}
      <g>
        <rect
          x="300"
          y="312"
          width="30"
          height="28"
          rx="5"
          fill="none"
          stroke={GREEN}
          strokeWidth="1.6"
        />
        <path d="M306 320 H324 M306 326 H324 M306 332 H318" stroke={GREEN} strokeWidth="1.4" />
        <Label x={344} y={332} fill={GREEN} size={16}>
          sda
        </Label>
        <Label x={420} y={332} size={13}>
          el disco duro, visto como un archivo más
        </Label>
      </g>
    </Card>
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
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.16)"
      />
      <g stroke={SKY} strokeWidth="1.6" fill="none">
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
      <Label x={cx} y={118} anchor="middle" size={13}>
        {name}
      </Label>
    </g>
  )
}

export function KernelDispositivosIllustration() {
  return (
    <Card
      id="ilu-kernel-dispositivos"
      title="Cada dispositivo habla con el kernel a traves de su propio controlador"
      height={300}
    >
      {DEVICES.map((device) => (
        <g key={device.name}>
          <DeviceGlyph cx={device.cx} name={device.name} />
          <path
            d={`M${device.cx} 128 V158`}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.6"
          />
          <rect
            x={device.cx - 56}
            y="158"
            width="112"
            height="32"
            rx="8"
            fill="rgba(125,211,252,0.10)"
            stroke="rgba(125,211,252,0.45)"
          />
          <Label x={device.cx} y={179} anchor="middle" fill={SKY} size={13}>
            controlador
          </Label>
          <path
            d={`M${device.cx} 190 V222`}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.6"
          />
        </g>
      ))}

      <rect
        x="60"
        y="222"
        width="700"
        height="48"
        rx="10"
        fill="rgba(196,30,58,0.16)"
        stroke="#c41e3a"
        strokeWidth="1.6"
      />
      <Label x={410} y={252} anchor="middle" fill={RED} size={17}>
        kernel
      </Label>
    </Card>
  )
}

/* ============================================================
   5. Comunicacion de red
   ============================================================ */

export function KernelRedIllustration() {
  return (
    <Card
      id="ilu-kernel-red"
      title="El equipo intercambia paquetes con internet siguiendo los protocolos de red"
      height={250}
    >
      {/* Tu equipo */}
      <rect
        x="40"
        y="66"
        width="210"
        height="112"
        rx="12"
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.16)"
      />
      <Label x={145} y={96} anchor="middle" fill={INK} size={15}>
        tu equipo
      </Label>
      <rect
        x="70"
        y="112"
        width="150"
        height="30"
        rx="7"
        fill="rgba(125,211,252,0.10)"
        stroke="rgba(125,211,252,0.45)"
      />
      <Label x={145} y={132} anchor="middle" fill={SKY} size={13}>
        192.168.1.42
      </Label>

      {/* Los paquetes van y vuelven */}
      <g>
        <path d="M266 104 H614" stroke="rgba(255,255,255,0.20)" strokeWidth="1.4" strokeDasharray="5 5" />
        <path d="M614 104 L604 99 L604 109 Z" fill="rgba(255,255,255,0.35)" />
        <rect x="320" y="98" width="13" height="13" rx="3" fill={SKY} opacity="0.85" />
        <rect x="410" y="98" width="13" height="13" rx="3" fill={SKY} opacity="0.6" />
        <rect x="500" y="98" width="13" height="13" rx="3" fill={SKY} opacity="0.4" />

        <path d="M614 152 H266" stroke="rgba(255,255,255,0.20)" strokeWidth="1.4" strokeDasharray="5 5" />
        <path d="M266 152 L276 147 L276 157 Z" fill="rgba(255,255,255,0.35)" />
        <rect x="340" y="146" width="13" height="13" rx="3" fill={GREEN} opacity="0.4" />
        <rect x="430" y="146" width="13" height="13" rx="3" fill={GREEN} opacity="0.6" />
        <rect x="520" y="146" width="13" height="13" rx="3" fill={GREEN} opacity="0.85" />

        <Label x={440} y={134} anchor="middle" size={13}>
          paquetes · TCP/IP
        </Label>
      </g>

      {/* La red, al otro lado */}
      <g>
        <g stroke={SKY} strokeWidth="1.6" fill="none">
          <circle cx="700" cy="122" r="44" />
          <ellipse cx="700" cy="122" rx="18" ry="44" />
          <path d="M656 122 H744 M664 98 H736 M664 146 H736" />
        </g>
        <Label x={700} y={196} anchor="middle" size={13}>
          otros computadores
        </Label>
      </g>
    </Card>
  )
}
