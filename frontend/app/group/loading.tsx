import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"

/**
 * El curso monta barra lateral, lecciona y terminal a la vez, y lee el markdown
 * del tema en el servidor: es de las entradas mas lentas de la aplicacion.
 */
export default function Loading() {
  return (
    <SkeletonScreen className="flex h-screen flex-col">
      <div className="h-16 shrink-0 border-b border-white/10 bg-[#0a0a0a]" />
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-72 shrink-0 flex-col gap-2 border-r border-border p-4 md:flex">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="mx-auto min-w-0 flex-1 space-y-4 px-8 py-10">
          <Skeleton className="h-9 w-2/3 max-w-xl" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-11/12 max-w-2xl" />
          <Skeleton className="h-40 w-full max-w-2xl rounded-xl" />
          <Skeleton className="h-4 w-10/12 max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
      </div>
    </SkeletonScreen>
  )
}
