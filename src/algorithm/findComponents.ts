import type { ComponentBox, PixelFrame } from './types'

/**
 * Connected-components labelling of non-transparent (foreground) pixels.
 *
 * Operates on a frame that has already had its background alpha cut to 0. A
 * pixel is foreground iff its alpha byte is non-zero. Each 4-connected blob
 * yields a bounding {@link ComponentBox}; blobs with fewer than `minArea`
 * pixels are dropped. Behaviour ported verbatim.
 *
 * Perf fix (spec 4b): the original grew a plain `Array` BFS queue and built a
 * per-pixel `neighbors` array literal fed to `forEach` — millions of tiny
 * allocations on large sheets. Here the queue is a preallocated `Int32Array`
 * with head/tail cursors (each pixel enqueued at most once) and the four
 * neighbor tests are inlined `if`s. Time is still O(w*h).
 */
export function findComponents(frame: PixelFrame, minArea: number): ComponentBox[] {
  const { data, width, height } = frame
  const size = width * height
  const seen = new Uint8Array(size)
  const queue = new Int32Array(size)
  const boxes: ComponentBox[] = []

  for (let start = 0; start < size; start += 1) {
    if (seen[start] || data[start * 4 + 3] === 0) continue

    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    let pixels = 0

    let head = 0
    let tail = 0
    queue[tail++] = start
    seen[start] = 1

    while (head < tail) {
      const index = queue[head++]
      const x = index % width
      const y = (index / width) | 0
      pixels += 1
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y

      if (x > 0) {
        const next = index - 1
        if (!seen[next] && data[next * 4 + 3] !== 0) {
          seen[next] = 1
          queue[tail++] = next
        }
      }
      if (x < width - 1) {
        const next = index + 1
        if (!seen[next] && data[next * 4 + 3] !== 0) {
          seen[next] = 1
          queue[tail++] = next
        }
      }
      if (y > 0) {
        const next = index - width
        if (!seen[next] && data[next * 4 + 3] !== 0) {
          seen[next] = 1
          queue[tail++] = next
        }
      }
      if (y < height - 1) {
        const next = index + width
        if (!seen[next] && data[next * 4 + 3] !== 0) {
          seen[next] = 1
          queue[tail++] = next
        }
      }
    }

    if (pixels >= minArea) {
      boxes.push({
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        pixels,
      })
    }
  }

  return boxes
}
