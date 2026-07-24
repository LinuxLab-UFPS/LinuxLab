import type { ComponentType, ReactNode } from "react"

/**
 * One line-art illustration per topic, drawn on the card's dark panel in the
 * AlgoMaster style: neutral strokes with a neon-red accent. Look them up with
 * `topicIllustration(number)`; topics without a match fall back to a generic one.
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
 * The tree-navigation simulator: the directory tree with a green "go here"
 * arrow pointing at the target directory (the simulator's objective).
 */
export function SimulatorTreeIllustration() {
  const GREEN = "#34d399"
  return (
    <Svg>
      <Folder x={88} y={16} color={LINE} />
      {/* branches to the two side directories */}
      <path d="M99 32 v8 M52 40 h94 M52 40 v10 M146 40 v10" stroke={BASE} strokeWidth="1.6" />
      <Folder x={41} y={50} color={LINE} />
      <Folder x={133} y={50} color={LINE} />
      {/* green "ir aquí" arrow pointing at the target directory */}
      <path d="M99 34 v22 M92 48 l7 8 l7 -8" stroke={GREEN} strokeWidth="3" />
      <Folder x={87} y={62} color={GREEN} />
    </Svg>
  )
}
