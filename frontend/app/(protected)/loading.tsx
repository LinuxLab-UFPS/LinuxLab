import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"

/**
 * Respaldo de toda la zona protegida: Next usa el `loading.tsx` mas cercano, asi
 * que cualquier ruta sin uno propio cae aqui en vez de no mostrar nada. La
 * cabecera ya esta pintada por el layout; esto solo ocupa el cuerpo.
 */
export default function Loading() {
  return (
    <SkeletonScreen className="mx-auto max-w-6xl px-6 py-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-10 space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </SkeletonScreen>
  )
}
