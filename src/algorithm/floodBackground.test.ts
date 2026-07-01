import { describe, it, expect } from 'vitest'
import { floodBackground } from './floodBackground'
import { isBackgroundPixel } from './isBackgroundPixel'
import type { PixelFrame } from './types'
import { BLACK, WHITE, paintedFrame } from './testFixtures'
import { DEFAULT_THRESHOLD } from './constants'

const T = DEFAULT_THRESHOLD

/**
 * Reference border-seeded flood fill (verbatim transcription of the original
 * renderer) for behavioural equivalence with the Int32Array-queue version.
 */
function referenceFlood(
  frame: PixelFrame,
  threshold: number,
): Uint8Array {
  const { data, width, height } = frame
  const size = width * height
  const seen = new Uint8Array(size)
  const background = new Uint8Array(size)
  const queue: number[] = []
  const add = (index: number): void => {
    if (seen[index]) return
    seen[index] = 1
    if (isBackgroundPixel(data, index, threshold)) queue.push(index)
  }
  for (let x = 0; x < width; x += 1) {
    add(x)
    add((height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    add(y * width)
    add(y * width + width - 1)
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor]
    background[index] = 1
    const x = index % width
    const y = Math.floor(index / width)
    if (x > 0) add(index - 1)
    if (x < width - 1) add(index + 1)
    if (y > 0) add(index - width)
    if (y < height - 1) add(index + width)
  }
  return background
}

describe('floodBackground', () => {
  it('solid white frame -> entire mask is background', () => {
    const frame = paintedFrame(5, 5, WHITE, {})
    const mask = floodBackground(frame, T)
    expect([...mask]).toEqual(new Array(25).fill(1))
  })

  it('object-on-white -> object pixels are not masked', () => {
    // 5x5 white with a 1x1 black object at center (2,2)
    const frame = paintedFrame(5, 5, WHITE, { '2,2': BLACK })
    const mask = floodBackground(frame, T)
    expect(mask[2 * 5 + 2]).toBe(0)
    // corners definitely background
    expect(mask[0]).toBe(1)
    expect(mask[24]).toBe(1)
  })

  it('enclosed background hole is NOT flooded (border-seeded)', () => {
    // 5x5: black ring around a white hole at (2,2). Hole is white but unreachable
    // from the border, so it must stay foreground (mask 0).
    const paint: Record<string, readonly [number, number, number, number]> = {}
    for (let i = 1; i <= 3; i += 1) {
      paint[`${i},1`] = BLACK
      paint[`${i},3`] = BLACK
      paint[`1,${i}`] = BLACK
      paint[`3,${i}`] = BLACK
    }
    // center (2,2) left white (hole)
    const frame = paintedFrame(5, 5, WHITE, paint)
    const mask = floodBackground(frame, T)
    expect(mask[2 * 5 + 2]).toBe(0) // enclosed white hole NOT background
    expect(mask[0]).toBe(1) // border white IS background
  })

  it('matches the original reference implementation on assorted frames', () => {
    const frames: PixelFrame[] = [
      paintedFrame(6, 4, WHITE, { '2,1': BLACK, '3,1': BLACK, '2,2': BLACK }),
      paintedFrame(8, 8, WHITE, {
        '3,3': BLACK,
        '4,3': BLACK,
        '3,4': BLACK,
        '4,4': BLACK,
      }),
      paintedFrame(3, 3, BLACK, {}), // all foreground
      paintedFrame(4, 4, WHITE, { '0,0': BLACK }), // object on the border
    ]
    for (const frame of frames) {
      const mine = floodBackground(frame, T)
      const ref = referenceFlood(frame, T)
      expect([...mine]).toEqual([...ref])
    }
  })

  it('transparent border pixels seed the flood (alpha < 8)', () => {
    // fully transparent frame -> all background via alpha rule
    const TRANSPARENT: [number, number, number, number] = [0, 0, 0, 0]
    const frame = paintedFrame(4, 4, TRANSPARENT, {})
    const mask = floodBackground(frame, T)
    expect([...mask]).toEqual(new Array(16).fill(1))
  })
})
