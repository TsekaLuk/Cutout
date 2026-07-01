/**
 * SliceDimensions (spec §4c) — W×H · position · byte size for the selected slice.
 */
import type { Slice } from '@/store/types'
import { Badge } from '@/components/ui/badge'
import { formatBytes } from '@/lib/image'

export interface SliceDimensionsProps {
  readonly slice: Slice
}

export function SliceDimensions({ slice }: SliceDimensionsProps) {
  return (
    <dl className="grid grid-cols-2 gap-2 text-xs">
      <Field label="Size">
        <Badge variant="secondary" className="font-mono tabular-nums">
          {slice.width}×{slice.height}
        </Badge>
      </Field>
      <Field label="Bytes">
        <span className="font-mono tabular-nums text-muted-foreground">
          {formatBytes(slice.blob.size)}
        </span>
      </Field>
      <Field label="Position">
        <span className="font-mono tabular-nums text-muted-foreground">
          {slice.box.x}, {slice.box.y}
        </span>
      </Field>
      <Field label="Index">
        <span className="font-mono tabular-nums text-muted-foreground">
          #{slice.index + 1}
        </span>
      </Field>
    </dl>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}
