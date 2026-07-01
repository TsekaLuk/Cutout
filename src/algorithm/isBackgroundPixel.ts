import { BACKGROUND_ALPHA_MAX } from './constants'

/**
 * Whether the pixel at flat `index` is background.
 *
 * Ported verbatim: background iff alpha < 8 OR all of r,g,b >= threshold.
 *
 * @param data   RGBA bytes (length = pixelCount * 4).
 * @param index  Flat pixel index (NOT the byte offset); byte offset is index*4.
 * @param threshold White-background RGB threshold.
 */
export function isBackgroundPixel(
  data: Uint8ClampedArray,
  index: number,
  threshold: number,
): boolean {
  const offset = index * 4
  const r = data[offset]
  const g = data[offset + 1]
  const b = data[offset + 2]
  const a = data[offset + 3]
  return (
    a < BACKGROUND_ALPHA_MAX ||
    (r >= threshold && g >= threshold && b >= threshold)
  )
}
