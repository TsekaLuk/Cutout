/**
 * RightRailTabs (spec §4c) — the narrow-rail presentation: a scrollable slice
 * grid and the inspector behind `Tabs [Slices][Inspector]`. Selecting a slice
 * from the grid does NOT auto-switch tabs (the bbox overlay is the feedback);
 * the user taps "Inspector" when they want details — keeps the interaction calm.
 */
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SliceGrid } from './SliceGrid'
import { InspectorPanel } from '@/components/inspector/InspectorPanel'
import { useSlices } from '@/store/selectors'

export function RightRailTabs() {
  const count = useSlices().length
  return (
    <Tabs defaultValue="slices" className="flex h-full min-h-0 flex-col gap-2 p-2">
      <TabsList className="w-full">
        <TabsTrigger value="slices">Slices{count > 0 ? ` (${count})` : ''}</TabsTrigger>
        <TabsTrigger value="inspector">Inspector</TabsTrigger>
      </TabsList>
      <TabsContent value="slices" className="min-h-0 overflow-y-auto">
        <SliceGrid />
      </TabsContent>
      <TabsContent value="inspector" className="min-h-0 overflow-y-auto">
        <InspectorPanel />
      </TabsContent>
    </Tabs>
  )
}
