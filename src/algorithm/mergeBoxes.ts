import type { ComponentBox } from './types'
import { boxesNear, unionBox } from './boxGeometry'

/**
 * Merge every group of boxes that are within `gap` of one another into their
 * bounding rectangle, matching the ORIGINAL algorithm's output exactly.
 *
 * ## Original behaviour (the contract we must reproduce)
 * The original repeatedly scanned all pairs, and on the *first* near pair grew
 * `A` into `A ∪ B`, dropped `B`, and restarted the scan. Because it re-checked
 * against the *grown* rectangle, a box `C` that is near neither `A` nor `B`
 * alone can still be absorbed once it becomes near `A ∪ B`. The terminal state
 * is a set of rectangles that are pairwise NOT near. That terminal state is a
 * function of the input set and `gap` only — it is independent of visiting
 * order (the "near" relation on rectangles is symmetric, and merging is
 * monotone: unioning can only make a rectangle larger, hence can only create,
 * never destroy, adjacencies). So any procedure that reaches a fixed point of
 * "no two rectangles are near" yields the same partition of the plane.
 *
 * ## Perf fix (spec 4b): union-find + uniform spatial hash + fixed-point
 * 1. Seed a disjoint-set forest over the original boxes.
 * 2. Bucket boxes into a uniform grid (cell ≈ max(gap, median box dim)); only
 *    test a box against boxes in its own cell + the 8 neighbours, cutting the
 *    O(n²) all-pairs scan to roughly O(n) for spatially-sparse sheets.
 * 3. Collapse each DSU set into one union rectangle.
 * 4. Fixed-point pass: re-test the (few) set rectangles for residual adjacency
 *    created by growth, merging until stable. This captures the original's
 *    grow-then-recheck transitivity.
 *
 * Returns a new array; inputs are not mutated.
 */
export function mergeBoxes(boxes: ComponentBox[], gap: number): ComponentBox[] {
  const n = boxes.length
  if (n <= 1) return boxes.map((box) => ({ ...box }))

  // --- disjoint-set union with path compression + union by rank ---
  const parent = new Int32Array(n)
  const rank = new Int32Array(n)
  for (let i = 0; i < n; i += 1) parent[i] = i

  const find = (i: number): number => {
    let root = i
    while (parent[root] !== root) root = parent[root]
    // path compression
    let cur = i
    while (parent[cur] !== root) {
      const next = parent[cur]
      parent[cur] = root
      cur = next
    }
    return root
  }

  const union = (a: number, b: number): void => {
    const ra = find(a)
    const rb = find(b)
    if (ra === rb) return
    if (rank[ra] < rank[rb]) {
      parent[ra] = rb
    } else if (rank[ra] > rank[rb]) {
      parent[rb] = ra
    } else {
      parent[rb] = ra
      rank[ra] += 1
    }
  }

  // --- uniform spatial-hash grid over original boxes ---
  // Cell size ≈ max(gap, median box dimension) keeps candidate lists small while
  // guaranteeing any near pair shares a cell or an 8-neighbour cell (a pair can
  // be near across at most `gap` of empty space; cell >= gap covers that).
  const cell = gridCellSize(boxes, gap)
  const grid = new Map<number, number[]>()
  const cellKey = (cx: number, cy: number): number =>
    // pack two 32-bit-ish cell coords into one number key (coords are small).
    cx * 0x40000000 + cy

  const cellOf = (v: number): number => Math.floor(v / cell)

  for (let i = 0; i < n; i += 1) {
    const b = boxes[i]
    const cx0 = cellOf(b.x)
    const cy0 = cellOf(b.y)
    const cx1 = cellOf(b.x + b.width)
    const cy1 = cellOf(b.y + b.height)
    // A box may straddle several cells; register it in each so neighbours in
    // any overlapped cell see it as a candidate.
    for (let cy = cy0; cy <= cy1; cy += 1) {
      for (let cx = cx0; cx <= cx1; cx += 1) {
        const key = cellKey(cx, cy)
        const bucket = grid.get(key)
        if (bucket) bucket.push(i)
        else grid.set(key, [i])
      }
    }
  }

  // For each box, test only against boxes in its cells + 8 neighbours.
  for (let i = 0; i < n; i += 1) {
    const b = boxes[i]
    const cx0 = cellOf(b.x) - 1
    const cy0 = cellOf(b.y) - 1
    const cx1 = cellOf(b.x + b.width) + 1
    const cy1 = cellOf(b.y + b.height) + 1
    const tested = new Set<number>()
    for (let cy = cy0; cy <= cy1; cy += 1) {
      for (let cx = cx0; cx <= cx1; cx += 1) {
        const bucket = grid.get(cellKey(cx, cy))
        if (!bucket) continue
        for (let k = 0; k < bucket.length; k += 1) {
          const j = bucket[k]
          if (j <= i || tested.has(j)) continue
          tested.add(j)
          if (find(i) === find(j)) continue
          if (boxesNear(b, boxes[j], gap)) union(i, j)
        }
      }
    }
  }

  // --- collapse DSU sets into union rectangles ---
  const rects = collapseSets(boxes, find, n)

  // --- fixed-point pass over the (few) set rectangles ---
  return fixedPointMerge(rects, gap)
}

/** Choose a grid cell size: at least 1, ~max(gap, median box dimension). */
function gridCellSize(boxes: ComponentBox[], gap: number): number {
  const dims: number[] = []
  for (const b of boxes) {
    dims.push(b.width, b.height)
  }
  dims.sort((a, b) => a - b)
  const median = dims[dims.length >> 1] ?? 1
  return Math.max(1, gap, median)
}

/** Group boxes by DSU root and union each group into one rectangle. */
function collapseSets(
  boxes: ComponentBox[],
  find: (i: number) => number,
  n: number,
): ComponentBox[] {
  const byRoot = new Map<number, ComponentBox>()
  for (let i = 0; i < n; i += 1) {
    const root = find(i)
    const existing = byRoot.get(root)
    byRoot.set(root, existing ? unionBox(existing, boxes[i]) : { ...boxes[i] })
  }
  return [...byRoot.values()]
}

/**
 * Re-merge any near pairs among the current rectangles until none remain.
 * The rectangle count here is small (post-collapse), so a simple all-pairs
 * fixed point is cheap and exactly reproduces the original's grow-then-recheck.
 */
function fixedPointMerge(input: ComponentBox[], gap: number): ComponentBox[] {
  const rects = input.map((r) => ({ ...r }))
  let changed = true
  while (changed) {
    changed = false
    outer: for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        if (boxesNear(rects[i], rects[j], gap)) {
          rects[i] = unionBox(rects[i], rects[j])
          rects.splice(j, 1)
          changed = true
          break outer
        }
      }
    }
  }
  return rects
}
