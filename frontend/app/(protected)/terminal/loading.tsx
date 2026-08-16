import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"

/**
 * La espera mas larga de la aplicacion: abrir una actividad de curso obliga al
 * servidor a pedir su detalle antes de pintar, y hasta que llega no habia nada
 * en pantalla — ni siquiera la consola, que no depende de esos datos.
 *
 * El esqueleto reproduce las dos columnas del taller para que al llegar el
 * contenido nada se mueva de sitio.
 */
export default function Loading() {
  return (
    <SkeletonScreen className="flex h-full gap-6 px-6 py-6">
      <div className="hidden w-80 shrink-0 flex-col gap-3 lg:flex">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Skeleton className="h-10 w-full rounded-t-xl" />
        <Skeleton className="min-h-0 flex-1 w-full rounded-xl" />
      </div>
    </SkeletonScreen>
  )
}
