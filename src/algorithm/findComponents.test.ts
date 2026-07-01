import { describe, it, expect } from 'vitest'
import { findComponents } from './findComponents'
import type { ComponentBox, PixelFrame } from './types'
import { BLACK, WHITE, paintedFrame } from './testFixtures'

/** A frame whose foreground = pixels with non-zero alpha. Background alpha=0. */
function fgFrame(
  width: number,
  height: number,
  fgCells: ReadonlyArray<readonly [number, number]>,
): PixelFrame {
  const paint: Record<string, readonly [number, number, number, number]> = {}
  for (const [x, y] of fgCells) paint[`${x},${y}`] = BLACK // opaque = foreground
  // fill = transparent white (alpha 0 => background/ignored by findComponents)
  return paintedFrame(width, height, [255, 255, 255, 0], paint)
}

/**
 * Reference connected-components (verbatim transcription of original renderer:
 * growing Array queue + per-pixel neighbors[] + forEach). Used to prove the
 * Int32Array + inline-neighbor version is behaviourally identical.
 */
function referenceComponents(frame: PixelFrame, minArea: number): ComponentBox[] {
  const { data, width, height } = frame
  const size = width * height
  const seen = new Uint8Array(size)
  const boxes: ComponentBox[] = []
  const queue: number[] = []

  for (let start = 0; start < size; start += 1) {
    if (seen[start] || data[start * 4 + 3] === 0) continue
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    let pixels = 0
    queue.length = 0
    queue.push(start)
    seen[start] = 1
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor]
      const x = index % width
      const y = Math.floor(index / width)
      pixels += 1
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      const neighbors = [
        x > 0 ? index - 1 : -1,
        x < width - 1 ? index + 1 : -1,
        y > 0 ? index - width : -1,
        y < height - 1 ? index + width : -1,
      ]
      neighbors.forEach((next) => {
        if (next < 0 || seen[next] || data[next * 4 + 3] === 0) return
        seen[next] = 1
        queue.push(next)
      })
    }
    if (pixels >= minArea) {
      boxes.push({
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        pixels,
      })
    }
  }
  return boxes
}

function canonical(boxes: ComponentBox[]): ComponentBox[] {
  return [...boxes].sort((a, b) => a.y - b.y || a.x - b.x)
}

describe('findComponents', () => {
  it('N separated blobs -> N boxes with exact bounds', () => {
    // 5x1 line: fg at 0,1 and 3,4 -> two components
    const frame = fgFrame(5, 1, [
      [0, 0],
      [1, 0],
      [3, 0],
      [4, 0],
    ])
    const boxes = canonical(findComponents(frame, 1))
    expect(boxes).toHaveLength(2)
    expect(boxes[0]).toEqual({ x: 0, y: 0, width: 2, height: 1, pixels: 2 })
    expect(boxes[1]).toEqual({ x: 3, y: 0, width: 2, height: 1, pixels: 2 })
  })

  it('drops components below minArea', () => {
    const frame = fgFrame(5, 1, [
      [0, 0], // 1px component
      [3, 0],
      [4, 0], // 2px component
    ])
    const boxes = findComponents(frame, 2)
    expect(boxes).toHaveLength(1)
    expect(boxes[0].pixels).toBe(2)
  })

  it('computes exact bbox x/y/w/h for an L-shape', () => {
    // L: (1,1),(1,2),(2,2)
    const frame = fgFrame(4, 4, [
      [1, 1],
      [1, 2],
      [2, 2],
    ])
    const boxes = findComponents(frame, 1)
    expect(boxes).toHaveLength(1)
    expect(boxes[0]).toEqual({ x: 1, y: 1, width: 2, height: 2, pixels: 3 })
  })

  it('diagonal pixels are NOT 4-connected (two components)', () => {
    const frame = fgFrame(3, 3, [
      [0, 0],
      [1, 1],
    ])
    expect(findComponents(frame, 1)).toHaveLength(2)
  })

  it('all-foreground frame -> single component covering the frame', () => {
    const frame = paintedFrame(4, 3, BLACK, {})
    const boxes = findComponents(frame, 1)
    expect(boxes).toHaveLength(1)
    expect(boxes[0]).toEqual({ x: 0, y: 0, width: 4, height: 3, pixels: 12 })
  })

  it('inline-neighbor version matches the original forEach reference', () => {
    const frames: PixelFrame[] = [
      fgFrame(6, 6, [
        [0, 0],
        [1, 0],
        [0, 1],
        [4, 4],
        [5, 5],
        [4, 5],
      ]),
      paintedFrame(5, 5, BLACK, {}),
      fgFrame(8, 4, [
        [1, 1],
        [2, 1],
        [3, 1],
        [6, 2],
        [6, 3],
      ]),
      fgFrame(3, 3, [
        [0, 0],
        [2, 2],
      ]),
    ]
    for (const frame of frames) {
      for (const minArea of [1, 2, 4]) {
        expect(canonical(findComponents(frame, minArea))).toEqual(
          canonical(referenceComponents(frame, minArea)),
        )
      }
    }
  })

  it('ignores WHITE opaque background only if its alpha is zero (uses alpha, not color)', () => {
    // Opaque white is FOREGROUND here (alpha 255) — findComponents keys off alpha.
    const frame = paintedFrame(2, 1, WHITE, {})
    const boxes = findComponents(frame, 1)
    expect(boxes).toHaveLength(1)
    expect(boxes[0].pixels).toBe(2)
  })
})
