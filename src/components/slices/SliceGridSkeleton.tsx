/**
 * SliceGridSkeleton (spec §4c) — placeholder grid while the first run computes.
 */
import { Skeleton } from '@/components/ui/skeleton'

export function SliceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="grid gap-1 rounded-lg border border-border/50 p-1.5">
          <Skeleton className="aspect-square w-full rounded-md" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  )
}
