/**
 * StatusBar (spec §4c) — count · total bytes · active param summary.
 *
 * A quiet footer that confirms the current result at a glance:
 *   "12 slices · 3.2 MB · thr 246 · area 900 · gap 18 · pad 10"
 * Params echo here so a user tuning sliders sees the committed values without
 * looking away from the output.
 */
import { useMemo } from 'react'
import { Trans, Plural, useLingui } from '@lingui/react/macro'
import { useSlices, useParams, useStatus } from '@/store/selectors'
import { formatBytes } from '@/lib/image'

export function StatusBar() {
  const { t } = useLingui()
  const slices = useSlices()
  const params = useParams()
  const status = useStatus()
  const { threshold, minArea, mergeGap, padding } = params

  const totalBytes = useMemo(
    () => slices.reduce((sum, slice) => sum + slice.blob.size, 0),
    [slices],
  )

  const statusLabel =
    status === 'running'
      ? t({ id: 'status.state_running', message: 'analyzing…' })
      : status === 'done'
        ? t({ id: 'status.state_done', message: 'done' })
        : status === 'error'
          ? t({ id: 'status.state_error', message: 'error' })
          : t({ id: 'status.state_idle', message: 'idle' })

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-border bg-background px-3 text-[11px] text-muted-foreground">
      <span className="tabular-nums">
        <Plural
          id="status.slice_count"
          value={slices.length}
          one="# slice"
          other="# slices"
        />
      </span>
      {slices.length > 0 && (
        <>
          <Dot />
          <span className="tabular-nums">{formatBytes(totalBytes)}</span>
        </>
      )}
      <Dot />
      <span className="font-mono tabular-nums">
        <Trans id="status.param_summary">
          thr {threshold} · area {minArea} · gap {mergeGap} · pad {padding}
        </Trans>
      </span>
      <span className="ml-auto capitalize">{statusLabel}</span>
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
