import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"

export default function Loading() {
  return (
    <SkeletonScreen className="min-h-full pb-24">
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <Skeleton className="h-11 w-72" />
        <Skeleton className="mt-3 h-1 w-24 rounded-full" />
        <Skeleton className="mt-5 h-6 w-[32rem] max-w-full" />
      </section>
      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-full sm:w-52" />
          <Skeleton className="h-9 w-full sm:w-40" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    </SkeletonScreen>
  )
}
