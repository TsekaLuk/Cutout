/**
 * SliceGrid (spec §4c) — the output grid with its four states:
 *   loading (first run, no slices yet) → skeleton
 *   done + slices                      → card grid
 *   done + zero regions / no source    → empty + quick-fix
 *
 * Selection lives in the store; arrow-key navigation is driven from AppShell's
 * hotkeys against `data-slice-id`, so the grid itself stays presentational.
 */
import { useSlices, useStatus } from '@/store/selectors'
import { useSource } from '@/store/selectors'
import { SliceCard } from './SliceCard'
import { SliceGridEmpty } from './SliceGridEmpty'
import { SliceGridSkeleton } from './SliceGridSkeleton'

export function SliceGrid() {
  const slices = useSlices()
  const status = useStatus()
  const hasSource = useSource().bitmap !== null

  // First run on a fresh source, nothing committed yet → skeleton.
  if (status === 'running' && slices.length === 0 && hasSource) {
    return <SliceGridSkeleton />
  }

  if (slices.length === 0) {
    return <SliceGridEmpty />
  }

  return (
    <div
      role="listbox"
      aria-label="Slices"
      aria-multiselectable={false}
      className="grid grid-cols-2 gap-2 p-2 xl:grid-cols-3"
    >
      {slices.map((slice) => (
        <SliceCard key={slice.id} slice={slice} />
      ))}
    </div>
  )
}
