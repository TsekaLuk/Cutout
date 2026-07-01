/**
 * Fit-to-pane geometry (shared by SourceCanvas + PreviewCanvas).
 *
 * Computes the scale + offset that centres a `srcW×srcH` image inside a
 * `boxW×boxH` viewport ("contain"), never upscaling past 1:1 unless asked.
 */
export interface FitResult {
  readonly scale: number
  readonly drawWidth: number
  readonly drawHeight: number
  readonly offsetX: number
  readonly offsetY: number
}

export function fitContain(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number,
  allowUpscale = false,
): FitResult {
  if (srcW <= 0 || srcH <= 0 || boxW <= 0 || boxH <= 0) {
    return { scale: 1, drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0 }
  }
  const raw = Math.min(boxW / srcW, boxH / srcH)
  const scale = allowUpscale ? raw : Math.min(raw, 1)
  const drawWidth = srcW * scale
  const drawHeight = srcH * scale
  return {
    scale,
    drawWidth,
    drawHeight,
    offsetX: (boxW - drawWidth) / 2,
    offsetY: (boxH - drawHeight) / 2,
  }
}
