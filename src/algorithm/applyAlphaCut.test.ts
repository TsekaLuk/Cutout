import { describe, it, expect } from 'vitest'
import { applyAlphaCut } from './applyAlphaCut'
import { alphaAt, BLACK, WHITE, paintedFrame } from './testFixtures'

describe('applyAlphaCut', () => {
  it('zeroes alpha of masked pixels and leaves others untouched', () => {
    const frame = paintedFrame(2, 1, BLACK, {})
    // mask: px0 background, px1 foreground
    const mask = new Uint8Array([1, 0])
    applyAlphaCut(frame, mask)
    expect(alphaAt(frame, 0, 0)).toBe(0)
    expect(alphaAt(frame, 1, 0)).toBe(255)
  })

  it('does not touch RGB channels', () => {
    const frame = paintedFrame(1, 1, WHITE, {})
    const mask = new Uint8Array([1])
    applyAlphaCut(frame, mask)
    expect([...frame.data]).toEqual([255, 255, 255, 0])
  })

  it('all-background mask zeroes every alpha', () => {
    const frame = paintedFrame(3, 2, BLACK, {})
    applyAlphaCut(frame, new Uint8Array(6).fill(1))
    for (let i = 0; i < 6; i += 1) {
      expect(frame.data[i * 4 + 3]).toBe(0)
    }
  })
})
