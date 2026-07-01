import { describe, it, expect } from 'vitest'
import { sortBoxes } from './sortBoxes'
import type { Box } from './types'

const b = (x: number, y: number): Box => ({ x, y, width: 1, height: 1 })

describe('sortBoxes', () => {
  it('orders top-to-bottom then left-to-right', () => {
    const input = [b(10, 20), b(5, 20), b(0, 0), b(30, 0)]
    expect(sortBoxes(input)).toEqual([b(0, 0), b(30, 0), b(5, 20), b(10, 20)])
  })

  it('is a stable reading order for a grid', () => {
    const input = [b(0, 10), b(10, 0), b(0, 0), b(10, 10)]
    expect(sortBoxes(input)).toEqual([b(0, 0), b(10, 0), b(0, 10), b(10, 10)])
  })

  it('does not mutate its input (immutable)', () => {
    const input = [b(10, 0), b(0, 0)]
    const snapshot = input.map((x) => ({ ...x }))
    const out = sortBoxes(input)
    expect(input).toEqual(snapshot)
    expect(out).not.toBe(input)
  })
})
