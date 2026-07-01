import { describe, it, expect } from 'vitest'
import { isBackgroundPixel } from './isBackgroundPixel'
import { DEFAULT_THRESHOLD } from './constants'

/** Build a 1-pixel RGBA buffer. */
function px(r: number, g: number, b: number, a: number): Uint8ClampedArray {
  return new Uint8ClampedArray([r, g, b, a])
}

describe('isBackgroundPixel', () => {
  const t = DEFAULT_THRESHOLD // 246

  it('is background when alpha < 8 regardless of color', () => {
    expect(isBackgroundPixel(px(0, 0, 0, 7), 0, t)).toBe(true)
    expect(isBackgroundPixel(px(10, 20, 30, 0), 0, t)).toBe(true)
  })

  it('is NOT background from alpha alone when alpha >= 8 and color is dark', () => {
    expect(isBackgroundPixel(px(0, 0, 0, 8), 0, t)).toBe(false)
    expect(isBackgroundPixel(px(0, 0, 0, 255), 0, t)).toBe(false)
  })

  it('is background when all of r,g,b >= threshold', () => {
    expect(isBackgroundPixel(px(246, 246, 246, 255), 0, t)).toBe(true)
    expect(isBackgroundPixel(px(255, 255, 255, 255), 0, t)).toBe(true)
    expect(isBackgroundPixel(px(250, 248, 246, 255), 0, t)).toBe(true)
  })

  it('boundary: exactly threshold on all channels is background (>=)', () => {
    expect(isBackgroundPixel(px(246, 246, 246, 200), 0, t)).toBe(true)
  })

  it('boundary: one channel below threshold is foreground', () => {
    expect(isBackgroundPixel(px(245, 246, 246, 200), 0, t)).toBe(false)
    expect(isBackgroundPixel(px(246, 245, 246, 200), 0, t)).toBe(false)
    expect(isBackgroundPixel(px(246, 246, 245, 200), 0, t)).toBe(false)
  })

  it('threshold 255 only treats pure white as background', () => {
    expect(isBackgroundPixel(px(255, 255, 255, 255), 0, 255)).toBe(true)
    expect(isBackgroundPixel(px(254, 255, 255, 255), 0, 255)).toBe(false)
  })

  it('reads the correct pixel at a non-zero index', () => {
    const data = new Uint8ClampedArray([
      /* px0 fg */ 0, 0, 0, 255,
      /* px1 bg */ 255, 255, 255, 255,
    ])
    expect(isBackgroundPixel(data, 0, t)).toBe(false)
    expect(isBackgroundPixel(data, 1, t)).toBe(true)
  })
})
