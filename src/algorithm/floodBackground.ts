import type { BackgroundMask, PixelFrame } from './types'
import { isBackgroundPixel } from './isBackgroundPixel'

/**
 * Border-seeded 4-connected flood fill marking every background pixel reachable
 * from the image edge. Background enclosed by foreground (holes) is NOT flooded.
 *
 * Behaviour ported verbatim from the original renderer. Perf fix (spec 4b): the
 * original grew a plain `Array` queue via `push`; here we use a preallocated
 * `Int32Array` with monotonic head/tail cursors. Each pixel is enqueued at most
 * once (guarded by `seen`), so `w*h` capacity needs no ring buffer. Neighbor
 * checks are inlined; `x = i % w` and `y = (i / w) | 0` are hoisted per dequeue.
 *
 * @returns A {@link BackgroundMask} (length `width*height`; 1 = background).
 */
export function floodBackground(
  frame: PixelFrame,
  threshold: number,
): BackgroundMask {
  const { data, width, height } = frame
  const size = width * height
  const seen = new Uint8Array(size)
  const background = new Uint8Array(size)
  const queue = new Int32Array(size)
  let tail = 0

  // Mirrors the original `add(index)`: mark seen once, enqueue only if background.
  const add = (index: number): void => {
    if (seen[index]) return
    seen[index] = 1
    if (isBackgroundPixel(data, index, threshold)) {
      queue[tail++] = index
    }
  }

  const lastRow = (height - 1) * width
  for (let x = 0; x < width; x += 1) {
    add(x)
    add(lastRow + x)
  }
  for (let y = 0; y < height; y += 1) {
    add(y * width)
    add(y * width + width - 1)
  }

  for (let head = 0; head < tail; head += 1) {
    const index = queue[head]
    background[index] = 1
    const x = index % width
    const y = (index / width) | 0
    if (x > 0) add(index - 1)
    if (x < width - 1) add(index + 1)
    if (y > 0) add(index - width)
    if (y < height - 1) add(index + width)
  }

  return background
}
