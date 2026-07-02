/**
 * PreviewPanel (spec §4c) — centre pane: the transparent result + view controls.
 *
 * Owns local view state (zoom mode, checkerboard) and composes the canvas,
 * toolbar, meta, an error banner, and the processing overlay. Content only, no
 * output editing — that is the right rail's job.
 */
import { useState } from 'react'
import { Trans } from '@lingui/react/macro'
import { AlertTriangle } from 'lucide-react'
import { useStore } from '@/store'
import { usePreviewBitmap, useStatus, selectError } from '@/store/selectors'
import { PreviewCanvas, type ZoomMode } from './PreviewCanvas'
import { PreviewToolbar } from './PreviewToolbar'
import { PreviewMeta } from './PreviewMeta'
import { ProcessingOverlay } from './ProcessingOverlay'

export function PreviewPanel() {
  const [zoom, setZoom] = useState<ZoomMode>('fit')
  const [checker, setChecker] = useState(true)
  const hasPreview = usePreviewBitmap() !== null
  const status = useStatus()
  const error = useStore(selectError)

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Trans id="preview.heading">Preview</Trans>
          </h2>
          <PreviewMeta />
        </div>
        <PreviewToolbar
          zoom={zoom}
          checker={checker}
          enabled={hasPreview}
          onZoomChange={setZoom}
          onCheckerToggle={() => setChecker((c) => !c)}
        />
      </header>

      {status === 'error' && error ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="truncate" title={error}>
            {error}
          </span>
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1">
        <PreviewCanvas zoom={zoom} checker={checker} />
        <ProcessingOverlay />
      </div>
    </div>
  )
}
