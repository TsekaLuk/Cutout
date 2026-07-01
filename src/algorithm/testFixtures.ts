import type { PixelFrame } from './types'

/**
 * Test-only helpers for building small RGBA {@link PixelFrame}s by hand.
 * Not a `.test.ts` file so it is importable by the suites without being run.
 */

export const BLACK: [number, number, number, number] = [0, 0, 0, 255]
export const WHITE: [number, number, number, number] = [255, 255, 255, 255]

/**
 * Build a frame from a 2D grid of RGBA tuples (`grid[y][x]`).
 * All rows must share the width of the first row.
 */
export function frameFromGrid(
  grid: ReadonlyArray<ReadonlyArray<readonly [number, number, number, number]>>,
): PixelFrame {
  const height = grid.length
  const width = height > 0 ? grid[0].length : 0
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = grid[y][x]
      const o = (y * width + x) * 4
      data[o] = r
      data[o + 1] = g
      data[o + 2] = b
      data[o + 3] = a
    }
  }
  return { data, width, height }
}

/**
 * Build a `width×height` frame filled with `fill`, then paint `paint` cells.
 * `paint` maps `"x,y"` → RGBA tuple.
 */
export function paintedFrame(
  width: number,
  height: number,
  fill: readonly [number, number, number, number],
  paint: Record<string, readonly [number, number, number, number]>,
): PixelFrame {
  const grid: Array<Array<readonly [number, number, number, number]>> = []
  for (let y = 0; y < height; y += 1) {
    const row: Array<readonly [number, number, number, number]> = []
    for (let x = 0; x < width; x += 1) row.push(fill)
    grid.push(row)
  }
  for (const key of Object.keys(paint)) {
    const [x, y] = key.split(',').map(Number)
    grid[y][x] = paint[key]
  }
  return frameFromGrid(grid)
}

/** Read the alpha byte of pixel (x,y). */
export function alphaAt(frame: PixelFrame, x: number, y: number): number {
  return frame.data[(y * frame.width + x) * 4 + 3]
}
