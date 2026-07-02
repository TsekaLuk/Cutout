/**
 * PreviewMeta (spec §4c) — "N regions" chip for the preview header.
 */
import { Plural } from '@lingui/react/macro'
import { useSlices } from '@/store/selectors'
import { Badge } from '@/components/ui/badge'

export function PreviewMeta() {
  const slices = useSlices()
  const count = slices.length
  if (count === 0) return null
  return (
    <Badge variant="secondary" className="tabular-nums">
      <Plural id="preview.region_count" value={count} one="# region" other="# regions" />
    </Badge>
  )
}
