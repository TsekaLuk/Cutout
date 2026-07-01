import type { Box } from './types'

/**
 * Sort boxes into reading order (top-to-bottom, then left-to-right).
 *
 * Ported verbatim from the original comparator `a.y - b.y || a.x - b.x`.
 * Immutable: the input array is not mutated; a new sorted array is returned.
 */
export function sortBoxes<T extends Box>(boxes: readonly T[]): T[] {
  return [...boxes].sort((a, b) => a.y - b.y || a.x - b.x)
}
