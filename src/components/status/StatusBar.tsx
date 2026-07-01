/**
 * StatusBar (spec §4c) — count · total bytes · active param summary.
 *
 * A quiet footer that confirms the current result at a glance:
 *   "12 slices · 3.2 MB · thr 246 · area 900 · gap 18 · pad 10"
 * Params echo here so a user tuning sliders sees the committed values without
 * looking away from the output.
 */
import { useMemo } from 'react'
import { useSlices, useParams, useStatus } from '@/store/selectors'
import { formatBytes } from '@/lib/image'

export function StatusBar() {
  const slices = useSlices()
  const params = useParams()
  const status = useStatus()

  const totalBytes = useMemo(
    () => slices.reduce((sum, slice) => sum + slice.blob.size, 0),
    [slices],
  )

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-border bg-background px-3 text-[11px] text-muted-foreground">
      <span className="tabular-nums">
        {slices.length} {slices.length === 1 ? 'slice' : 'slices'}
      </span>
      {slices.length > 0 && (
        <>
          <Dot />
          <span className="tabular-nums">{formatBytes(totalBytes)}</span>
        </>
      )}
      <Dot />
      <span className="font-mono tabular-nums">
        thr {params.threshold} · area {params.minArea} · gap {params.mergeGap} ·
        pad {params.padding}
      </span>
      <span className="ml-auto capitalize">
        {status === 'running' ? 'analyzing…' : status}
      </span>
    </footer>
  )
}

function Dot() {
  return (
    <span aria-hidden className="opacity-40">
      ·
    </span>
  )
}
