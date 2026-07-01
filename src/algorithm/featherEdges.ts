import type { BackgroundMask, PixelFrame } from './types'
import { FEATHER_ALPHA_CAP, FEATHER_NEAR_WHITE_MIN } from './constants'

/**
 * 1px anti-halo feather, IN PLACE.
 *
 * For each interior foreground pixel that touches a background pixel (4-connected)
 * and is "near white" (each of r,g,b strictly above 235), cap its alpha at 90.
 * This softens the white fringe left by anti-aliasing on the original sheet.
 *
 * Ported verbatim. A snapshot (`copy`) of the mask is taken so newly-dilated
 * pixels do not cascade within a single pass — matching the original. Mutates
 * the worker-owned `frame.data` (spec 4b).
 */
export function featherEdges(frame: PixelFrame, background: BackgroundMask): void {
  const { data, width, height } = frame
  const copy = new Uint8Array(background)

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x
      if (copy[index]) continue

      const touchesBackground =
        copy[index - 1] ||
        copy[index + 1] ||
        copy[index - width] ||
        copy[index + width]
      if (!touchesBackground) continue

      const offset = index * 4
      if (
        data[offset] > FEATHER_NEAR_WHITE_MIN &&
        data[offset + 1] > FEATHER_NEAR_WHITE_MIN &&
        data[offset + 2] > FEATHER_NEAR_WHITE_MIN
      ) {
        data[offset + 3] = Math.min(data[offset + 3], FEATHER_ALPHA_CAP)
      }
    }
  }
}
