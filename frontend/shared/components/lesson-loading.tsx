"use client"

import { createContext, useCallback, useContext, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
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
 * no hay promesa que suspenda. Lo que si se puede observar es la transicion: la
 * navegacion se lanza desde aqui con `startTransition` y `pending` queda a la
 * vista de quien lo necesite.
 */
interface Valor {
  pending: boolean
  /** null fuera del proveedor: entonces el enlace navega por su cuenta. */
  go: ((href: string) => void) | null
}

const Contexto = createContext<Valor>({ pending: false, go: null })

export function LessonLoadingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const go = useCallback(
    (href: string) => {
      startTransition(() => router.push(href))
    },
    [router],
  )

  const valor = useMemo(() => ({ pending, go }), [pending, go])
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
