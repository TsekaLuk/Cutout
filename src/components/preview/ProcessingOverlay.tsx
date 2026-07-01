/**
 * ProcessingOverlay (spec §4c) — subtle "analyzing…" veil over the preview.
 *
 * Shown only while a run is in flight AND we already have something to dim
 * (a prior preview); the very first run leans on the empty-state copy instead,
 * so the pane never flashes an overlay onto blankness.
 */
import { Loader2 } from 'lucide-react'
import { useStatus, usePreviewBitmap } from '@/store/selectors'

export function ProcessingOverlay() {
  const status = useStatus()
  const hasPreview = usePreviewBitmap() !== null

  if (status !== 'running' || !hasPreview) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/35 backdrop-blur-[1px]">
      <span className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
        <Loader2 className="size-3.5 animate-spin" />
        Analyzing…
      </span>
    </div>
  )
}
