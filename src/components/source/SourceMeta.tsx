/**
 * SourceMeta (spec §4c) — `W×H · filename · N regions` readout under the source.
 */
import { useLingui } from '@lingui/react/macro'
import { plural } from '@lingui/core/macro'
import { useSource, useSlices, useStatus } from '@/store/selectors'
import { Badge } from '@/components/ui/badge'

export function SourceMeta() {
  const { t } = useLingui()
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
        {source.name || t({ id: 'source.meta_untitled', message: 'untitled' })}
      </span>
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <span className="tabular-nums">
        {status === 'running' && slices.length === 0
          ? t({ id: 'source.meta_analyzing', message: 'analyzing…' })
          : t({
              id: 'source.meta_region_count',
              message: plural(slices.length, {
                one: '# region',
                other: '# regions',
              }),
            })}
      </span>
    </div>
  )
}
