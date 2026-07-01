/**
 * SourcePanel (spec §4c) — left pane: the source image + its read parameters.
 *
 * Empty state = the full DropZone hero. Loaded state = source canvas, a slim
 * replace bar, meta, then the parameter sliders. Params sit *under* the source
 * because they govern how it is read.
 */
import { useSource } from '@/store/selectors'
import { DropZone } from './DropZone'
import { SourceCanvas } from './SourceCanvas'
import { SourceMeta } from './SourceMeta'
import { ParameterControls } from './ParameterControls'
import { Separator } from '@/components/ui/separator'

export function SourcePanel() {
  const hasSource = useSource().bitmap !== null

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      {hasSource ? (
        <>
          <SourceCanvas />
          <DropZone variant="compact" />
          <SourceMeta />
          <Separator />
          <ParameterControls />
        </>
      ) : (
        <DropZone variant="full" />
      )}
    </div>
  )
}
