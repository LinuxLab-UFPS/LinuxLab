"use client"

import { createContext, useCallback, useContext, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
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
  go: (href: string) => void
}

const Contexto = createContext<Valor>({ pending: false, go: () => {} })

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
