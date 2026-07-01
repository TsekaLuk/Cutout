/**
 * InspectorPanel (spec §4c) — details for the selected slice: preview, name,
 * dimensions, export. Empty when nothing is selected.
 */
import { MousePointerClick } from 'lucide-react'
import { useSelectedSlice, useSlices } from '@/store/selectors'
import { SliceThumb } from '@/components/slices/SliceThumb'
import { SliceNameField } from './SliceNameField'
import { SliceDimensions } from './SliceDimensions'
import { ExportBar } from './ExportBar'
import { Separator } from '@/components/ui/separator'

export function InspectorPanel() {
  const selected = useSelectedSlice()
  const hasSlices = useSlices().length > 0

  if (!selected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <MousePointerClick className="size-7 text-muted-foreground/50" />
        <p className="max-w-52 text-xs text-muted-foreground">
          {hasSlices
            ? 'Select a slice to rename, inspect, and export it.'
            : 'Sliced regions and their details will show up here.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid content-start gap-3 p-3">
      <div className="mx-auto w-40 max-w-full">
        <SliceThumb slice={selected} />
      </div>
      <SliceNameField slice={selected} />
      <Separator />
      <SliceDimensions slice={selected} />
      <Separator />
      <ExportBar slice={selected} />
    </div>
  )
}
