/**
 * El pie del sitio: quien hizo esto y quien lo dirigio.
 *
 * Va al final de las dos portadas, la publica y la del estudiante.
 *
 * Los nombres, las fotos y los enlaces viven en las dos constantes de abajo,
 * para que cambiarlos no obligue a leer el resto del archivo. Las rutas de foto
 * apuntan a `public/equipo/`; sin `foto`, `Avatar` pinta las iniciales en un
 * circulo en vez de dejar el hueco de una imagen rota.
 */

interface Persona {
  nombre: string
  /** Ruta bajo `public/`, o nada para quedarse con las iniciales. */
  foto?: string
  /** Solo la direccion lo lleva: sale como etiqueta al lado del nombre. */
  cargo?: string
  /** Con esto el nombre se vuelve enlace. Siempre a un sitio de fuera. */
  enlace?: string
}

const AUTORES: Persona[] = [
  {
    nombre: "Andersson Camilo Cardenas Guarin",
    foto: "/equipo/andersson.jpg",
    enlace: "https://github.com/anderssonccg",
  },
  {
    nombre: "Mauricio Di Donato Sanchez",
    foto: "/equipo/mauricio.jpg",
    enlace: "https://github.com/MauricioDDS",
  },
]

const DIRECCION: Persona[] = [
  {
    nombre: "Ph.D. Marco Antonio Adarme Jaimes",
    foto: "/equipo/marco.jpg",
    cargo: "Director",
    enlace: "https://madarme.co/",
  },
]

/** Las iniciales del nombre, saltandose los titulos y las particulas. */
function iniciales(nombre: string): string {
  const fuera = new Set(["ph.d.", "phd", "dr.", "de", "del", "la", "los"])
  return nombre
    .split(/\s+/)
    .filter((p) => !fuera.has(p.toLowerCase()))
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
}

/**
 * La foto, o las iniciales si todavia no hay foto.
 *
 * Se usa `<img>` y no `next/image` a proposito: son cuatro retratos fijos y
 * pequeños, y `next/image` obligaria a declarar tamaños y dominios para no
 * ganar nada.
 */
function Avatar({ persona }: { persona: Persona }) {
  if (!persona.foto) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70">
        {iniciales(persona.nombre)}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={persona.foto}
      alt=""
      aria-hidden
      className="h-10 w-10 shrink-0 rounded-full object-cover"
    />
  )
}

function Columna({ titulo, gente }: { titulo: string; gente: Persona[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-[10rem_1fr]">
      <h3 className="text-sm text-white/50">{titulo}</h3>
      <ul className="space-y-4">
        {gente.map((persona) => (
          <li key={persona.nombre} className="flex items-center gap-3">
            <Avatar persona={persona} />
            {/* `noreferrer` ademas de `noopener`: el segundo cierra el acceso a
                esta pestaña desde la que se abre, el primero evita mandar de
                donde vino. Salen fuera del sitio, asi que van los dos. */}
            {persona.enlace ? (
              <a
                href={persona.enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-white underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {persona.nombre}
              </a>
            ) : (
              <span className="text-sm font-medium text-white">{persona.nombre}</span>
            )}
            {persona.cargo && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                {persona.cargo}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer id="autores" className="bg-[#0d1117] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-xl font-bold tracking-tight text-white">
          Autores y dirección
        </h2>
        <div className="mt-10 space-y-10">
          <Columna titulo="Autores" gente={AUTORES} />
          <div className="border-t border-white/10 pt-10">
            <Columna titulo="Dirección" gente={DIRECCION} />
          </div>
        </div>
      </div>
    </footer>
  )
}
