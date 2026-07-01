/**
 * RightRail (spec §4c) — outputs only: the slice grid + the inspector.
 *
 * Two presentations, chosen by the rail's own width:
 *  - wide (≥ RAIL_STACK_WIDTH): grid on top, inspector docked below (stacked).
 *  - narrow: `Tabs [Slices][Inspector]` so neither gets squeezed.
 *
 * Width is observed locally (the rail is itself a resizable pane), so the
 * switch responds to dragging the divider, not just the window.
 */
import { useSlices } from '@/store/selectors'
import { useElementSize } from '@/hooks/useElementSize'
import { SliceGrid } from './SliceGrid'
import { RightRailTabs } from './RightRailTabs'
import { InspectorPanel } from '@/components/inspector/InspectorPanel'
import { Separator } from '@/components/ui/separator'

/** Below this rail width the stacked layout gets cramped → switch to tabs. */
const RAIL_STACK_WIDTH = 340

export function RightRail() {
  const { ref, size } = useElementSize<HTMLDivElement>()
  const wide = size.width >= RAIL_STACK_WIDTH
  const count = useSlices().length

  return (
    <div ref={ref} className="flex h-full min-h-0 flex-col">
      {wide ? (
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Slices{count > 0 ? ` · ${count}` : ''}
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SliceGrid />
          </div>
          <Separator />
          <div className="max-h-[45%] min-h-0 shrink-0 overflow-y-auto">
            <InspectorPanel />
          </div>
        </div>
      ) : (
        <RightRailTabs />
      )}
    </div>
  )
}
