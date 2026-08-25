"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

/**
 * Avisa de que se esta cargando otra leccion.
 *
 * Cambiar de tema es una vuelta al servidor: lee el markdown, lo trocea y manda
 * el resultado. Tarda, y mas en produccion. Hasta que llega, Next deja en
 * pantalla la leccion anterior sin ninguna senal, asi que parece que el clic no
 * hizo nada.
 *
 * No sirve un `loading.tsx` de la ruta —taparia tambien la lista de temas, y esa
 * no cambia— ni un `Suspense`, porque las lecciones se leen de forma sincrona y
 * no hay promesa que suspenda.
 *
 * Antes esto colgaba de `useTransition`, y el velo se quedaba pegado: `pending`
 * es contabilidad interna de React sobre si la transicion llego a confirmarse, y
 * hay caminos en los que no lo hace (una navegacion que interrumpe a otra, o un
 * push que Next resuelve sin producir actualizacion). El contenido nuevo estaba
 * en pantalla y el velo encima.
 *
 * Lo que se observa ahora es la ruta, que es lo que de verdad importa: se apunta
 * de donde se sale y el velo se levanta en cuanto la direccion cambia, sea a
 * donde se pidio o a cualquier otro sitio. Y hay un plazo maximo, para que no
 * pueda quedarse puesto ni aunque la navegacion nunca ocurra.
 */
interface Valor {
  pending: boolean
  /** null fuera del proveedor: entonces el enlace navega por su cuenta. */
  go: ((href: string) => void) | null
}

const Contexto = createContext<Valor>({ pending: false, go: null })

/** Plazo maximo del velo. Si algo sale mal, la pagina se recupera sola. */
const TOPE_MS = 10000

/**
 * La direccion en una forma comparable: mismo orden de parametros y sin origen,
 * para que `/group?sub=x&tema=y` y `/group?tema=y&sub=x` cuenten como la misma.
 */
function clave(href: string): string {
  try {
    const url = new URL(href, "http://l")
    const params = new URLSearchParams(url.searchParams)
    params.sort()
    const cola = params.toString()
    return cola ? `${url.pathname}?${cola}` : url.pathname
  } catch {
    return href
  }
}

export function LessonLoadingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()

  const actual = useMemo(() => {
    const cola = search.toString()
    return clave(cola ? `${pathname}?${cola}` : pathname)
  }, [pathname, search])

  // De donde salimos. Mientras siga siendo la direccion actual, la leccion
  // pedida no ha llegado.
  const [desde, setDesde] = useState<string | null>(null)

  const go = useCallback(
    (href: string) => {
      // Clic en la leccion en la que ya se esta: no hay nada que esperar, y
      // poner el velo aqui era una forma segura de dejarlo puesto.
      if (clave(href) === actual) return
      setDesde(actual)
      router.push(href)
    },
    [router, actual],
  )

  useEffect(() => {
    if (desde !== null && actual !== desde) setDesde(null)
  }, [desde, actual])

  useEffect(() => {
    if (desde === null) return
    const id = window.setTimeout(() => setDesde(null), TOPE_MS)
    return () => window.clearTimeout(id)
  }, [desde])

  const valor = useMemo(() => ({ pending: desde !== null, go }), [desde, go])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useLessonLoading(): Valor {
  return useContext(Contexto)
}

/**
 * Un enlace a otra leccion: el mismo `Link` de siempre, pero pasando por la
 * transicion para que el velo aparezca mientras llega.
 *
 * Lo usan los dos caminos que llevan de una leccion a otra —la lista de temas y
 * los botones de anterior/siguiente— porque si solo uno lo hiciera, la mitad de
 * los clics se quedarian sin respuesta visible.
 */
export function LessonLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const { go } = useLessonLoading()

  return (
    <Link
      href={href}
      onClick={(e) => {
        // Con modificador el navegador abre otra pestaña o ventana: la pagina
        // actual no cambia, asi que no hay transicion que enseñar. Sin
        // proveedor, tampoco: se deja navegar al `Link`.
        if (!go || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        go(href)
      }}
      className={className}
    >
      {children}
    </Link>
  )
}

/**
 * El velo sobre el contenido mientras llega la leccion. Solo cubre su columna:
 * la lista de temas sigue viva para poder cambiar de idea a mitad de carga.
 */
export function LessonLoadingOverlay() {
  const { pending } = useLessonLoading()
  if (!pending) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 z-20 flex justify-center bg-background/70 backdrop-blur-[1px]"
    >
      <span className="sr-only">Cargando la lección…</span>
      {/* Pegajoso: el velo cubre toda la columna, que puede medir varias
          pantallas, y con una posicion fija dentro de ella el spinner quedaria
          fuera de vista si el lector habia bajado. */}
      <Loader2 className="sticky top-[38vh] h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}
