/**
 * Las ilustraciones de los dos primeros temas: la mascota, el arbol de Unix y
 * el simbolo del sistema.
 *
 * Tux es el unico dibujo del curso con colores fijos, y a proposito: el negro,
 * el amarillo del pico y las patas y la panza clara son su identidad, no una
 * eleccion de paleta. Los otros dos van por tokens del tema, como los diagramas
 * del kernel, para que se lean igual en claro y en oscuro.
 *
 * Se insertan con `<!-- ILLUSTRATION: id -->` (ver lesson-blocks.ts).
 */

const TRAZO = "stroke-muted-foreground/50"
const TEXTO = "fill-foreground"
const APUNTE = "fill-muted-foreground"
const MONO = "var(--font-geist-mono), ui-monospace, monospace"

/* Los colores de Tux, que no dependen del tema. */
const TUX_NEGRO = "#1b1b1b"
const TUX_PANZA = "#f7f7f2"
const TUX_AMARILLO = "#f5b53f"
const TUX_AMARILLO_OSCURO = "#d8952a"

/**
 * Tux, la mascota del Kernel.
 *
 * Se dibuja por piezas apiladas —cuerpo, panza, aletas, ojos, pico, patas— en
 * vez de con un solo trazado: cada parte queda legible por separado y se puede
 * corregir sin rehacer el resto.
 */
export function TuxIllustration() {
  return (
    <svg
      viewBox="0 0 240 310"
      role="img"
      aria-labelledby="ilu-tux"
      className="mx-auto my-8 block w-full max-w-[220px]"
    >
      <title id="ilu-tux">
        Tux, el pingüino que sirve de mascota al Kernel de Linux, con el pico y
        las patas amarillos y la panza clara
      </title>

      {/* Patas, debajo del cuerpo para que el borde inferior las tape */}
      <g fill={TUX_AMARILLO} stroke={TUX_AMARILLO_OSCURO} strokeWidth="2.5">
        <path d="M104 250 C 84 254, 56 268, 46 282 C 40 291, 48 297, 64 297 L 106 297 C 116 297, 120 288, 116 276 Z" />
        <path d="M136 250 C 156 254, 184 268, 194 282 C 200 291, 192 297, 176 297 L 134 297 C 124 297, 120 288, 124 276 Z" />
      </g>

      {/* Aletas, tambien por detras */}
      <g fill={TUX_NEGRO}>
        <path d="M60 146 C 24 166, 10 214, 22 248 C 30 268, 58 264, 58 246 C 44 212, 44 176, 64 152 Z" />
        <path d="M180 146 C 216 166, 230 214, 218 248 C 210 268, 182 264, 182 246 C 196 212, 196 176, 176 152 Z" />
      </g>

      {/* Cuerpo */}
      <path
        d="M120 24
           C 88 24, 66 50, 64 86
           C 44 110, 34 150, 34 190
           C 34 244, 72 276, 120 276
           C 168 276, 206 244, 206 190
           C 206 150, 196 110, 176 86
           C 174 50, 152 24, 120 24 Z"
        fill={TUX_NEGRO}
      />

      {/* Panza */}
      <path
        d="M120 100
           C 92 100, 72 134, 72 182
           C 72 230, 94 258, 120 258
           C 146 258, 168 230, 168 182
           C 168 134, 148 100, 120 100 Z"
        fill={TUX_PANZA}
      />

      {/* Ojos */}
      <ellipse cx="102" cy="76" rx="13" ry="17" fill={TUX_PANZA} />
      <ellipse cx="138" cy="76" rx="13" ry="17" fill={TUX_PANZA} />
      <circle cx="106" cy="79" r="6" fill={TUX_NEGRO} />
      <circle cx="134" cy="79" r="6" fill={TUX_NEGRO} />

      {/* Pico */}
      <path
        d="M120 90
           C 106 90, 96 98, 96 107
           C 96 116, 106 123, 120 123
           C 134 123, 144 116, 144 107
           C 144 98, 134 90, 120 90 Z"
        fill={TUX_AMARILLO}
        stroke={TUX_AMARILLO_OSCURO}
        strokeWidth="2"
      />
      <path
        d="M97 107 H143"
        stroke={TUX_AMARILLO_OSCURO}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}

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
