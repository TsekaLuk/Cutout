import { describe, it, expect } from 'vitest'
import { mergeBoxes } from './mergeBoxes'
import type { ComponentBox } from './types'

/**
 * GOLDEN reference: a faithful, verbatim transcription of the ORIGINAL Electron
 * renderer's mergeBoxes/near/unionBox (HEAD~1:src/renderer/renderer.js). The new
 * DSU + spatial-grid + fixed-point implementation MUST produce output equal (as
 * a set of rectangles) to this reference across every fixture below.
 */
function referenceNear(a: ComponentBox, b: ComponentBox, gap: number): boolean {
  return !(
    a.x + a.width + gap < b.x ||
    b.x + b.width + gap < a.x ||
    a.y + a.height + gap < b.y ||
    b.y + b.height + gap < a.y
  )
}

function referenceUnionBox(a: ComponentBox, b: ComponentBox): ComponentBox {
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

function referenceMergeBoxes(boxes: ComponentBox[], gap: number): ComponentBox[] {
  const merged = boxes.map((box) => ({ ...box }))
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < merged.length; i += 1) {
      for (let j = i + 1; j < merged.length; j += 1) {
        if (!referenceNear(merged[i], merged[j], gap)) continue
        merged[i] = referenceUnionBox(merged[i], merged[j])
        merged.splice(j, 1)
        changed = true
        break
      }
      if (changed) break
    }
  }
  return merged
}

/** Order-independent comparison: sort both by geometry then deep-equal. */
function canonical(boxes: ComponentBox[]): ComponentBox[] {
  return [...boxes].sort(
    (a, b) => a.x - b.x || a.y - b.y || a.width - b.width || a.height - b.height,
  )
}

function box(
  x: number,
  y: number,
  width: number,
  height: number,
  pixels = width * height,
): ComponentBox {
  return { x, y, width, height, pixels }
}

function assertEquivalent(boxes: ComponentBox[], gap: number): void {
  const expected = canonical(referenceMergeBoxes(boxes, gap))
  const actual = canonical(mergeBoxes(boxes, gap))
  // Set-of-rectangles must match exactly. Pixel sums must also match (total
  // foreground is conserved regardless of merge order, since union sums pixels).
  expect(actual.map(({ pixels: _p, ...r }) => r)).toEqual(
    expected.map(({ pixels: _p, ...r }) => r),
  )
  const totalActual = actual.reduce((s, b) => s + b.pixels, 0)
  const totalExpected = expected.reduce((s, b) => s + b.pixels, 0)
  expect(totalActual).toBe(totalExpected)
}

describe('mergeBoxes — golden equivalence vs original algorithm', () => {
  it('empty input', () => {
    assertEquivalent([], 10)
  })

  it('single box passes through unchanged', () => {
    const input = [box(5, 5, 10, 10)]
    assertEquivalent(input, 10)
    expect(mergeBoxes(input, 10)).toEqual(input)
  })

  it('two overlapping boxes merge', () => {
    assertEquivalent([box(0, 0, 20, 20), box(10, 10, 20, 20)], 0)
  })

  it('two near boxes (within gap) merge', () => {
    // 5px apart horizontally, gap 8 -> near.
    assertEquivalent([box(0, 0, 10, 10), box(15, 0, 10, 10)], 8)
  })

  it('two near boxes just outside gap do NOT merge', () => {
    // 5px apart, gap 4 -> not near.
    assertEquivalent([box(0, 0, 10, 10), box(15, 0, 10, 10)], 4)
  })

  it('gap=0: touching edges count as near, 1px separation does not', () => {
    // touching: b.x == a.x+a.width -> not(a.x+a.width+0 < b.x) => near
    assertEquivalent([box(0, 0, 10, 10), box(10, 0, 10, 10)], 0)
    // 1px gap with gap=0 -> a.x+w < b.x -> not near
    assertEquivalent([box(0, 0, 10, 10), box(11, 0, 10, 10)], 0)
  })

  it('chain: A-B-C where C is near B but not A alone (transitive grow-then-recheck)', () => {
    // A:[0..10], B:[13..23], C:[26..36]; gap 4. A~B (3<=4), B~C (3<=4), A~C? 26-10=16 >4 no.
    // Original grows A∪B=[0..23], then C near [0..23]? 26-23=3<=4 yes -> all merge.
    assertEquivalent(
      [box(0, 0, 10, 5), box(13, 0, 10, 5), box(26, 0, 10, 5)],
      4,
    )
  })

  it('disjoint clusters stay separate', () => {
    assertEquivalent(
      [
        box(0, 0, 10, 10),
        box(12, 0, 10, 10), // near first (gap>=2)
        box(200, 200, 10, 10),
        box(215, 200, 10, 10), // near third
      ],
      3,
    )
  })

  it('2D grid of near boxes all collapse into one', () => {
    const input: ComponentBox[] = []
    for (let gy = 0; gy < 4; gy += 1) {
      for (let gx = 0; gx < 4; gx += 1) {
        input.push(box(gx * 12, gy * 12, 10, 10))
      }
    }
    assertEquivalent(input, 3) // 2px gaps -> all near their neighbours -> single blob
  })

  it('L-shaped transitive chain forces fixed-point growth', () => {
    // Boxes that only connect once an intermediate union has grown.
    assertEquivalent(
      [
        box(0, 0, 10, 10),
        box(0, 14, 10, 10),
        box(14, 14, 10, 10),
        box(28, 14, 10, 10),
        box(28, 0, 10, 10),
      ],
      5,
    )
  })

  it('randomized fuzz: 40 fixtures of scattered boxes across gaps', () => {
    let seed = 123456789
    const rand = (): number => {
      // deterministic LCG for reproducible fixtures
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    for (let t = 0; t < 40; t += 1) {
      const count = 2 + Math.floor(rand() * 18)
      const boxes: ComponentBox[] = []
      for (let i = 0; i < count; i += 1) {
        const x = Math.floor(rand() * 100)
        const y = Math.floor(rand() * 100)
        const w = 4 + Math.floor(rand() * 20)
        const h = 4 + Math.floor(rand() * 20)
        boxes.push(box(x, y, w, h))
      }
      const gap = Math.floor(rand() * 12)
      assertEquivalent(boxes, gap)
    }
  })

  it('does not mutate its input', () => {
    const input = [box(0, 0, 10, 10), box(12, 0, 10, 10)]
    const snapshot = input.map((b) => ({ ...b }))
    mergeBoxes(input, 4)
    expect(input).toEqual(snapshot)
  })
})
