/**
 * SourceCanvas (spec §4c) — draws the loaded source bitmap, fit-to-pane.
 *
 * The store keeps `source.bitmap` on the main thread precisely so this canvas
 * can render it (the worker gets its own transferred clone). We redraw on
 * bitmap change and on pane resize, accounting for devicePixelRatio so the
 * source stays crisp.
 */
import { useEffect, useRef } from 'react'
import { useSource } from '@/store/selectors'
import { useElementSize } from '@/hooks/useElementSize'
import { fitContain } from '@/lib/fit'

export function SourceCanvas() {
  const source = useSource()
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const bitmap = source.bitmap

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const { width, height } = size
    canvas.width = Math.max(1, Math.floor(width * dpr))
    canvas.height = Math.max(1, Math.floor(height * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    if (!bitmap || width === 0 || height === 0) return
    const fit = fitContain(bitmap.width, bitmap.height, width, height)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, fit.offsetX, fit.offsetY, fit.drawWidth, fit.drawHeight)
  }, [bitmap, size])

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/30"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}
