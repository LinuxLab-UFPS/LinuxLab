/**
 * Las ilustraciones de los dos primeros temas: el arbol de Unix y el simbolo
 * del sistema.
 *
 * Las dos van por tokens del tema, como los diagramas del kernel, para que se
 * lean igual en claro y en oscuro. Tux no esta aqui: es una imagen real
 * (`tux-evolution.png`), porque la mascota tiene un dibujo oficial y volver a
 * trazarla a mano solo daba una version peor.
 *
 * Se insertan con `<!-- ILLUSTRATION: id -->` (ver lesson-blocks.ts).
 */

const TRAZO = "stroke-muted-foreground/50"
const TEXTO = "fill-foreground"
const APUNTE = "fill-muted-foreground"
const MONO = "var(--font-geist-mono), ui-monospace, monospace"

/* ---------- el arbol de Unix ---------- */

const ARBOL_W = 820
const ARBOL_H = 320

/** Una caja del arbol, con su rotulo centrado y el año debajo. */
function Nodo({
  x,
  y,
  w,
  texto,
  anio,
  destacado = false,
}: {
  x: number
  y: number
  w: number
  texto: string
  anio?: string
  destacado?: boolean
}) {
  const h = anio ? 46 : 32
  return (
    <g transform={`translate(${x - w / 2}, ${y})`}>
      <rect
        width={w}
        height={h}
        rx="7"
        fill="none"
        strokeWidth={destacado ? 2.4 : 1.6}
        className={destacado ? "stroke-primary" : TRAZO}
      />
      <text
        x={w / 2}
        y={anio ? 20 : 21}
        textAnchor="middle"
        fontSize="14"
        fontFamily={MONO}
        className={destacado ? "fill-primary" : TEXTO}
      >
        {texto}
      </text>
      {anio ? (
        <text
          x={w / 2}
          y={36}
          textAnchor="middle"
          fontSize="11"
          fontFamily={MONO}
          className={APUNTE}
        >
          {anio}
        </text>
      ) : null}
    </g>
  )
}

/**
 * De donde sale cada familia de sistemas tipo Unix.
 *
 * La linea que baja hasta Linux va discontinua a proposito: las demas ramas
 * heredaron codigo de Unix, y Linux no. Torvalds escribio el suyo desde cero
 * mirando como se comportaba MINIX, y esa diferencia es justo la que explica
 * por que Linux es UNIX-like y no UNIX.
 */
export function UnixTreeIllustration() {
  return (
    <svg
      viewBox={`0 0 ${ARBOL_W} ${ARBOL_H}`}
      role="img"
      aria-labelledby="ilu-unix-arbol"
      className="mx-auto my-8 block w-full max-w-3xl"
    >
      <title id="ilu-unix-arbol">
        Árbol que parte de Unix en 1969 y se ramifica en BSD, System V y MINIX,
        con Linux naciendo aparte en 1991 sin heredar código
      </title>

      {/* Tronco y ramas */}
      <g fill="none" strokeWidth="1.6" className={TRAZO}>
        <path d="M410 74 V 100" />
        <path d="M150 100 H 670" />
        <path d="M150 100 V 126  M410 100 V 126  M670 100 V 126" />

        <path d="M150 172 V 196  M410 172 V 196" />
        <path d="M92 196 H 232  M368 196 H 465" />
        <path d="M92 196 V 222  M232 196 V 222" />
        <path d="M368 196 V 222  M465 196 V 222" />
      </g>

      {/* De MINIX a Linux: inspiracion, no herencia */}
      <path
        d="M670 172 V 222"
        fill="none"
        strokeWidth="1.8"
        strokeDasharray="6 6"
        className="stroke-primary/70"
      />
      <text
        x={684}
        y={202}
        fontSize="11"
        fontFamily={MONO}
        className="fill-primary/80"
      >
        se inspira en
      </text>

      <Nodo x={410} y={28} w={210} texto="Unix" anio="1969 · Bell Labs" />

      <Nodo x={150} y={126} w={150} texto="BSD" anio="1977" />
      <Nodo x={410} y={126} w={150} texto="System V" anio="1983" />
      <Nodo x={670} y={126} w={150} texto="MINIX" anio="1987" />

      <Nodo x={92} y={222} w={170} texto="FreeBSD · OpenBSD" />
      <Nodo x={232} y={222} w={100} texto="macOS" />
      <Nodo x={368} y={222} w={100} texto="Solaris" />
      <Nodo x={465} y={222} w={76} texto="AIX" />
      <Nodo x={670} y={222} w={150} texto="Linux" anio="1991" destacado />

      {/* Nota al pie */}
      <text
        x={ARBOL_W / 2}
        y={300}
        textAnchor="middle"
        fontSize="12"
        fontFamily={MONO}
        className={APUNTE}
      >
        línea continua: hereda código · discontinua: solo copia el
        comportamiento
      </text>
    </svg>
  )
}

/**
 * El simbolo del sistema.
 *
 * Un `$` y el cursor: lo unico que hay en pantalla antes de escribir nada, y la
 * senal de que el shell termino lo anterior y espera la siguiente orden.
 */
export function PromptDollarIllustration() {
  return (
    <svg
      viewBox="0 0 300 120"
      role="img"
      aria-labelledby="ilu-prompt"
      className="mx-auto my-8 block w-full max-w-[260px]"
    >
      <title id="ilu-prompt">
        El símbolo de dólar del prompt seguido del cursor que espera la orden
      </title>
      <rect
        x="1.5"
        y="1.5"
        width="297"
        height="117"
        rx="12"
        fill="#1a1d24"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="1.8"
      />
      <text
        x="104"
        y="78"
        textAnchor="end"
        fontSize="56"
        fontFamily={MONO}
        fill="#ff5470"
      >
        $
      </text>
      <rect x="122" y="38" width="24" height="42" rx="3" fill="#c9d1d9" />
    </svg>
  )
}
