/**
 * PreviewCanvas (spec §4c) — blits the worker's transparent result bitmap and
 * overlays the selected slice's bounding box (closes the card↔sheet loop).
 *
 * Two zoom modes: `fit` (contain, no upscale) and `1:1` (device-pixel accurate,
 * scrollable). The checkerboard behind the canvas is a CSS utility so real
 * alpha shows through. The bbox is drawn in the same transform as the bitmap so
 * it
 * tracks the image under both zoom and resize.
 */
import { useEffect, useRef } from 'react'
import { Trans } from '@lingui/react/macro'
import { usePreviewBitmap, useSelectedSlice } from '@/store/selectors'
import { useElementSize } from '@/hooks/useElementSize'
import { fitContain } from '@/lib/fit'
import type { Box } from '@/algorithm/types'
import { cn } from '@/lib/utils'

export type ZoomMode = 'fit' | 'actual'

export interface PreviewCanvasProps {
  readonly zoom: ZoomMode
  readonly checker: boolean
}

export function PreviewCanvas({ zoom, checker }: PreviewCanvasProps) {
  const bitmap = usePreviewBitmap()
  const selected = useSelectedSlice()
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const selectedBox = selected?.box ?? null

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    draw(ctx, canvas, bitmap, size, zoom, selectedBox)
  }, [bitmap, size, zoom, selectedBox])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg border border-border/60',
        checker && 'bg-checker',
      )}
    >
      {bitmap ? (
        <canvas
          ref={canvasRef}
          className={zoom === 'fit' ? 'h-full w-full' : 'block'}
        />
      ) : (
        <p className="px-6 text-center text-sm text-muted-foreground">
          <Trans id="preview.empty_hint">
            The transparent preview appears here once a sheet is analyzed.
          </Trans>
        </p>
      )}
    </div>
  )
}

interface Size {
  readonly width: number
  readonly height: number
}

/** Render bitmap + optional bbox for the current zoom mode. */
function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bitmap: ImageBitmap | null,
  box: Size,
  zoom: ZoomMode,
  selected: Box | null,
): void {
  const dpr = window.devicePixelRatio || 1

  if (!bitmap) {
    canvas.width = 1
    canvas.height = 1
    return
  }

  if (zoom === 'actual') {
    // Native pixels; the container scrolls. CSS size = image size.
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.style.width = `${bitmap.width}px`
    canvas.style.height = `${bitmap.height}px`
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, bitmap.width, bitmap.height)
    ctx.drawImage(bitmap, 0, 0)
    if (selected) strokeBox(ctx, selected, 1)
    return
  }

  // Fit mode: contain into the box, centred, no upscale.
  const { width, height } = box
  if (width === 0 || height === 0) return
  canvas.width = Math.max(1, Math.floor(width * dpr))
  canvas.height = Math.max(1, Math.floor(height * dpr))
  canvas.style.width = ''
  canvas.style.height = ''
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const fit = fitContain(bitmap.width, bitmap.height, width, height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, fit.offsetX, fit.offsetY, fit.drawWidth, fit.drawHeight)

  if (selected) {
    ctx.save()
    ctx.translate(fit.offsetX, fit.offsetY)
    ctx.scale(fit.scale, fit.scale)
    strokeBox(ctx, selected, 1 / fit.scale)
    ctx.restore()
  }
}

/** Draw the selected-slice outline (primary colour, crisp at any scale). */
function strokeBox(
  ctx: CanvasRenderingContext2D,
  b: Box,
  lineWidth: number,
): void {
  ctx.save()
  ctx.lineWidth = Math.max(lineWidth, 0.5) * 1.5
  ctx.strokeStyle = 'oklch(0.62 0.19 255)'
  ctx.setLineDash([6 * lineWidth, 4 * lineWidth])
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.width, b.height)
  ctx.restore()
}
