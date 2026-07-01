import type { BackgroundMask, PixelFrame } from './types'

/**
 * Zero the alpha channel of every background pixel, IN PLACE.
 *
 * The `frame.data` buffer is worker-owned and nothing else references it, so
 * in-place mutation is the correct high-perf design (spec 4b) — not a violation
 * of the app's immutability rule, which targets shared state.
 *
 * Ported verbatim from the original renderer's post-flood alpha loop.
 */
export function applyAlphaCut(frame: PixelFrame, background: BackgroundMask): void {
  const { data } = frame
  for (let i = 0; i < background.length; i += 1) {
    if (background[i]) {
      data[i * 4 + 3] = 0
    }
  }
}
