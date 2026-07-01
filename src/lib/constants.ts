/**
 * UI constants (spec §4c).
 *
 * `PARAM_RANGES` is the slider contract — min/max/step/default/label for each of
 * the four cutout parameters. The defaults here mirror `DEFAULT_PARAMS` in
 * `store/slices/params.ts`; both trace back to the spec §4c table.
 */
import type { ParamKey } from '@/store/types'

/** Static descriptor for one parameter slider. */
export interface ParamRange {
  readonly key: ParamKey
  readonly label: string
  /** Short one-line explanation shown under the slider / in a tooltip. */
  readonly hint: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly def: number
}

/**
 * The parameter-slider contract (spec §4c). Order is the display order.
 *
 * | Param     | min | max  | step | default |
 * |-----------|-----|------|------|---------|
 * | threshold | 220 | 255  | 1    | 246     |
 * | minArea   | 80  | 5000 | 20   | 900     |
 * | mergeGap  | 0   | 80   | 1    | 18      |
 * | padding   | 0   | 40   | 1    | 10      |
 */
export const PARAM_RANGES: readonly ParamRange[] = [
  {
    key: 'threshold',
    label: 'Threshold',
    hint: 'How white a pixel must be to count as background.',
    min: 220,
    max: 255,
    step: 1,
    def: 246,
  },
  {
    key: 'minArea',
    label: 'Min area',
    hint: 'Drop regions smaller than this many pixels.',
    min: 80,
    max: 5000,
    step: 20,
    def: 900,
  },
  {
    key: 'mergeGap',
    label: 'Merge gap',
    hint: 'Merge regions closer than this many pixels.',
    min: 0,
    max: 80,
    step: 1,
    def: 18,
  },
  {
    key: 'padding',
    label: 'Padding',
    hint: 'Transparent margin added around each slice.',
    min: 0,
    max: 40,
    step: 1,
    def: 10,
  },
] as const

/** Lookup a range descriptor by key (used by the inspector / status bar). */
export const PARAM_RANGE_BY_KEY: Readonly<Record<ParamKey, ParamRange>> =
  Object.fromEntries(PARAM_RANGES.map((r) => [r.key, r])) as Record<
    ParamKey,
    ParamRange
  >

/**
 * Above this source size (megapixels) live preview is skipped in favour of a
 * commit-only run so dragging stays smooth (spec §4b risk #5). Kept beside the
 * hook constant so tuning happens in one place.
 */
export const MAX_LIVE_PREVIEW_MP = 4

/** Accepted image MIME types for import (drop + picker). */
export const ACCEPTED_IMAGE_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/gif',
]

/** `localStorage` key remembering the resizable pane layout (spec §4c). */
export const WORKSPACE_LAYOUT_KEY = 'acs-main'

/** Breakpoint (px) below which the workspace stacks vertically (spec §4c). */
export const STACK_BREAKPOINT = 1040
