import { describe, it, expect } from 'vitest'
import { featherEdges } from './featherEdges'
import { alphaAt, paintedFrame } from './testFixtures'
import { FEATHER_ALPHA_CAP } from './constants'

const NEAR_WHITE: [number, number, number, number] = [240, 240, 240, 255]
const NOT_NEAR_WHITE: [number, number, number, number] = [235, 235, 235, 255]
const DARK: [number, number, number, number] = [10, 10, 10, 255]

describe('featherEdges', () => {
  it('caps alpha of near-white foreground pixels that touch background', () => {
    // 3x3: center foreground near-white, surrounded by background.
    const frame = paintedFrame(3, 3, NEAR_WHITE, {})
    // mask: all background except center (1,1)
    const mask = new Uint8Array(9).fill(1)
    mask[1 * 3 + 1] = 0
    featherEdges(frame, mask)
    expect(alphaAt(frame, 1, 1)).toBe(FEATHER_ALPHA_CAP) // 90
  })

  it('leaves interior foreground (not touching background) untouched', () => {
    // 3x3 all foreground near-white, mask all 0 -> center touches no background.
    const frame = paintedFrame(3, 3, NEAR_WHITE, {})
    const mask = new Uint8Array(9).fill(0)
    featherEdges(frame, mask)
    expect(alphaAt(frame, 1, 1)).toBe(255)
  })

  it('does not touch edge pixel that is exactly 235 on a channel (> is strict)', () => {
    const frame = paintedFrame(3, 3, NOT_NEAR_WHITE, {})
    const mask = new Uint8Array(9).fill(1)
    mask[1 * 3 + 1] = 0
    featherEdges(frame, mask)
    expect(alphaAt(frame, 1, 1)).toBe(255) // 235 is NOT > 235
  })

  it('does not touch dark foreground even when it touches background', () => {
    const frame = paintedFrame(3, 3, DARK, {})
    const mask = new Uint8Array(9).fill(1)
    mask[1 * 3 + 1] = 0
    featherEdges(frame, mask)
    expect(alphaAt(frame, 1, 1)).toBe(255)
  })

  it('only lowers alpha, never raises it (Math.min semantics)', () => {
    // near-white foreground already at alpha 50 -> stays 50 (< cap 90)
    const frame = paintedFrame(3, 3, [240, 240, 240, 50], {})
    const mask = new Uint8Array(9).fill(1)
    mask[1 * 3 + 1] = 0
    featherEdges(frame, mask)
    expect(alphaAt(frame, 1, 1)).toBe(50)
  })

  it('ignores the outer 1px border (loop runs 1..height-2 / 1..width-2)', () => {
    // corner foreground near-white; border is never feathered by design.
    const frame = paintedFrame(3, 3, NEAR_WHITE, {})
    const mask = new Uint8Array(9).fill(1)
    mask[0] = 0 // (0,0) foreground on the border
    featherEdges(frame, mask)
    expect(alphaAt(frame, 0, 0)).toBe(255)
  })
})
