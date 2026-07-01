/// <reference lib="webworker" />
import type { Box, PixelFrame } from '@/algorithm/types'

/**
 * OffscreenCanvas-backed rendering helpers. This is the ONLY algorithm-adjacent
 * module allowed to touch canvas APIs — the pure `algorithm/**` modules stay
 * DOM-free. Runs inside the worker (spec §4b / §6).
 */

/** Draw a source `ImageBitmap` and read its RGBA pixels into a {@link PixelFrame}. */
export function bitmapToFrame(bitmap: ImageBitmap): PixelFrame {
  const width = bitmap.width
  const height = bitmap.height
  const canvas = new OffscreenCanvas(width, height)
  const ctx = get2d(canvas)
  ctx.drawImage(bitmap, 0, 0)
  const imageData = ctx.getImageData(0, 0, width, height)
  return { data: imageData.data, width, height }
}

/**
 * Blit a processed {@link PixelFrame} into an OffscreenCanvas and hand back a
 * transferable `ImageBitmap` for the center preview.
 */
export function renderFullBitmap(frame: PixelFrame): ImageBitmap {
  const canvas = renderFrameCanvas(frame)
  return canvas.transferToImageBitmap()
}

/**
 * Encode the region of `frame` described by `box` as a PNG blob.
 *
 * The full frame is rendered once to a reusable canvas by the caller; here we
 * crop by drawing that canvas into a box-sized canvas, then `convertToBlob`.
 */
export async function cropSlicePng(full: OffscreenCanvas, box: Box): Promise<Blob> {
  const crop = new OffscreenCanvas(box.width, box.height)
  const ctx = get2d(crop)
  ctx.drawImage(
    full,
    box.x,
    box.y,
    box.width,
    box.height,
    0,
    0,
    box.width,
    box.height,
  )
  return crop.convertToBlob({ type: 'image/png' })
}

/** Render a frame to a canvas we keep (source for both preview + slice crops). */
export function renderFrameCanvas(frame: PixelFrame): OffscreenCanvas {
  const canvas = new OffscreenCanvas(frame.width, frame.height)
  const ctx = get2d(canvas)
  // The `ImageData` constructor requires an `ArrayBuffer`-backed view (not a
  // `SharedArrayBuffer`). Wrap the frame bytes in a plain-`ArrayBuffer` view so
  // the generic buffer type of `PixelFrame.data` narrows correctly. This shares
  // the underlying buffer (no pixel copy) when it is already an `ArrayBuffer`.
  const pixels = toArrayBufferView(frame.data)
  const imageData = new ImageData(pixels, frame.width, frame.height)
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/** Narrow a possibly-`SharedArrayBuffer`-backed view to an `ArrayBuffer` one. */
function toArrayBufferView(
  data: Uint8ClampedArray,
): Uint8ClampedArray<ArrayBuffer> {
  if (data.buffer instanceof ArrayBuffer) {
    return data as Uint8ClampedArray<ArrayBuffer>
  }
  return new Uint8ClampedArray(data)
}

function get2d(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable')
  return ctx
}
