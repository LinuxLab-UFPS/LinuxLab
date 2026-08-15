import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"

export default function Loading() {
  return (
    <SkeletonScreen className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="m-4 min-h-0 flex-1 rounded-lg" />
    </SkeletonScreen>
  )
}
