import type { Box, ComponentBox } from './types'

/**
 * Whether two boxes are within `gap` pixels of each other (or overlapping).
 *
 * Ported verbatim from the original `near()`: the boxes are NOT near iff there
 * is a horizontal or vertical separation strictly greater than `gap`.
 */
export function boxesNear(a: Box, b: Box, gap: number): boolean {
  return !(
    a.x + a.width + gap < b.x ||
    b.x + b.width + gap < a.x ||
    a.y + a.height + gap < b.y ||
    b.y + b.height + gap < a.y
  )
}

/**
 * The bounding box that covers both inputs, summing their pixel counts.
 * Ported verbatim from the original `unionBox()`. Returns a new box.
 */
export function unionBox(a: ComponentBox, b: ComponentBox): ComponentBox {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const right = Math.max(a.x + a.width, b.x + b.width)
  const bottom = Math.max(a.y + a.height, b.y + b.height)
  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
    pixels: a.pixels + b.pixels,
  }
}

/**
 * Grow `box` by `padding` on every side, clamped to the image bounds.
 * Ported verbatim from the original `padBox()`. Returns a new box.
 */
export function padBox(
  box: Box,
  padding: number,
  width: number,
  height: number,
): Box {
  const x = Math.max(0, box.x - padding)
  const y = Math.max(0, box.y - padding)
  const right = Math.min(width, box.x + box.width + padding)
  const bottom = Math.min(height, box.y + box.height + padding)
  return { x, y, width: right - x, height: bottom - y }
}
