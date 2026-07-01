/**
 * SourceMeta (spec §4c) — `W×H · filename · N regions` readout under the source.
 */
import { useSource, useSlices, useStatus } from '@/store/selectors'
import { Badge } from '@/components/ui/badge'

export function SourceMeta() {
  const source = useSource()
  const slices = useSlices()
  const status = useStatus()

  if (!source.bitmap) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <Badge variant="secondary" className="font-mono">
        {source.width}×{source.height}
      </Badge>
      <span className="truncate" title={source.name}>
        {source.name || 'untitled'}
      </span>
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <span className="tabular-nums">
        {status === 'running' && slices.length === 0
          ? 'analyzing…'
          : `${slices.length} ${slices.length === 1 ? 'region' : 'regions'}`}
      </span>
    </div>
  )
}
