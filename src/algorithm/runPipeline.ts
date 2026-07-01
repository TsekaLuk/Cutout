import type { Box, CutoutParams, PixelFrame } from './types'
import { floodBackground } from './floodBackground'
import { applyAlphaCut } from './applyAlphaCut'
import { featherEdges } from './featherEdges'
import { findComponents } from './findComponents'
import { mergeBoxes } from './mergeBoxes'
import { padBox } from './boxGeometry'
import { sortBoxes } from './sortBoxes'

/** Result of a full pipeline run: the mutated frame plus final slice boxes. */
export interface PipelineResult {
  /** The same `PixelFrame` passed in, now background-cut and feathered in place. */
  readonly frame: PixelFrame
  /** Final slice boxes in reading order (padded, clamped to image bounds). */
  readonly boxes: Box[]
}

/** Thrown by {@link runPipeline} when an abort signal fires between stages. */
export class PipelineAbortError extends Error {
  constructor() {
    super('Pipeline aborted')
    this.name = 'PipelineAbortError'
  }
}

/**
 * Run the 6-stage cutout pipeline, mutating `frame.data` in place (worker-owned).
 *
 * Stage order is ported verbatim from the original Electron renderer:
 *   1. floodBackground  → background mask
 *   2. applyAlphaCut    → zero background alpha
 *   3. featherEdges     → 1px anti-halo
 *   4. findComponents   → foreground bounding boxes (>= minArea)
 *   5. mergeBoxes       → merge boxes within mergeGap
 *   6. padBox + sort    → pad each merged box, then order top-to-bottom / left-to-right
 *
 * `signal` (if provided) is checked between stages; an aborted signal throws
 * {@link PipelineAbortError} so a superseded run stops promptly (spec §6).
 */
export function runPipeline(
  frame: PixelFrame,
  params: CutoutParams,
  signal?: AbortSignal,
): PipelineResult {
  const { threshold, minArea, mergeGap, padding } = params
  const { width, height } = frame

  const checkAbort = (): void => {
    if (signal?.aborted) throw new PipelineAbortError()
  }

  const background = floodBackground(frame, threshold)
  checkAbort()

  applyAlphaCut(frame, background)
  checkAbort()

  featherEdges(frame, background)
  checkAbort()

  const components = findComponents(frame, minArea)
  checkAbort()

  const merged = mergeBoxes(components, mergeGap)
  checkAbort()

  const padded = merged.map((box) => padBox(box, padding, width, height))
  const boxes = sortBoxes(padded)

  return { frame, boxes }
}
