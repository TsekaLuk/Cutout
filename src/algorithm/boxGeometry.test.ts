import { describe, it, expect } from 'vitest'
import { boxesNear, unionBox, padBox } from './boxGeometry'
import type { ComponentBox } from './types'

function cb(x: number, y: number, w: number, h: number, pixels = w * h): ComponentBox {
  return { x, y, width: w, height: h, pixels }
}

describe('boxesNear', () => {
  it('overlapping boxes are near for any gap >= 0', () => {
    expect(boxesNear(cb(0, 0, 10, 10), cb(5, 5, 10, 10), 0)).toBe(true)
  })

  it('touching edges are near at gap 0', () => {
    expect(boxesNear(cb(0, 0, 10, 10), cb(10, 0, 10, 10), 0)).toBe(true)
  })

  it('1px apart is NOT near at gap 0 but IS at gap 1', () => {
    expect(boxesNear(cb(0, 0, 10, 10), cb(11, 0, 10, 10), 0)).toBe(false)
    expect(boxesNear(cb(0, 0, 10, 10), cb(11, 0, 10, 10), 1)).toBe(true)
  })

  it('is symmetric', () => {
    const a = cb(0, 0, 10, 10)
    const b = cb(15, 0, 10, 10)
    for (const gap of [0, 3, 5, 8]) {
      expect(boxesNear(a, b, gap)).toBe(boxesNear(b, a, gap))
    }
  })

  it('vertical separation respected independently of horizontal', () => {
    // horizontally overlapping, vertically 5px apart
    expect(boxesNear(cb(0, 0, 10, 10), cb(0, 15, 10, 10), 4)).toBe(false)
    expect(boxesNear(cb(0, 0, 10, 10), cb(0, 15, 10, 10), 5)).toBe(true)
  })
})

describe('unionBox', () => {
  it('covers both boxes and sums pixels', () => {
    const u = unionBox(cb(0, 0, 10, 10, 100), cb(20, 5, 10, 10, 50))
    expect(u).toEqual({ x: 0, y: 0, width: 30, height: 15, pixels: 150 })
  })

  it('is associative on geometry', () => {
    const a = cb(0, 0, 5, 5)
    const b = cb(10, 0, 5, 5)
    const c = cb(0, 10, 5, 5)
    const left = unionBox(unionBox(a, b), c)
    const right = unionBox(a, unionBox(b, c))
    const geom = ({ x, y, width, height }: ComponentBox) => ({ x, y, width, height })
    expect(geom(left)).toEqual(geom(right))
  })
})

describe('padBox', () => {
  it('grows by padding on all sides when interior', () => {
    expect(padBox({ x: 10, y: 10, width: 5, height: 5 }, 3, 100, 100)).toEqual({
      x: 7,
      y: 7,
      width: 11,
      height: 11,
    })
  })

  it('clamps to top-left image bounds', () => {
    expect(padBox({ x: 1, y: 1, width: 5, height: 5 }, 5, 100, 100)).toEqual({
      x: 0,
      y: 0,
      width: 11, // right = min(100, 1+5+5)=11, x=0 -> width 11
      height: 11,
    })
  })

  it('clamps to bottom-right image bounds', () => {
    // box near right/bottom edge of a 20x20 image
    expect(padBox({ x: 12, y: 12, width: 5, height: 5 }, 5, 20, 20)).toEqual({
      x: 7,
      y: 7,
      width: 13, // right=min(20,12+5+5)=20 -> 20-7
      height: 13,
    })
  })

  it('padding 0 is identity', () => {
    const b = { x: 3, y: 4, width: 6, height: 7 }
    expect(padBox(b, 0, 100, 100)).toEqual(b)
  })
})
