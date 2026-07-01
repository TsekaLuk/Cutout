/**
 * PreviewMeta (spec §4c) — "N regions" chip for the preview header.
 */
import { useSlices } from '@/store/selectors'
import { Badge } from '@/components/ui/badge'

export function PreviewMeta() {
  const slices = useSlices()
  if (slices.length === 0) return null
  return (
    <Badge variant="secondary" className="tabular-nums">
      {slices.length} {slices.length === 1 ? 'region' : 'regions'}
    </Badge>
  )
}
