/**
 * Zustand store shape (spec §5).
 *
 * Zustand owns everything that is (a) synchronous and (b) never leaves the
 * process: the source bitmap, the four params, the analysis result (preview +
 * slices), and the selection. Anything crossing an I/O boundary (export, cloud
 * library, session) lives in TanStack Query instead.
 *
 * `ImageBitmap` is the transfer unit both ways — not `HTMLImageElement` or a
 * dataURL, which would bloat snapshots. `bitmap.close()` is called on every
 * superseded / replaced bitmap to guard against GPU leaks.
 */
import type { Box, CutoutParams } from '@/algorithm/types'

/** The four tunable parameters (defaults live in `slices/params.ts`). */
export type Params = CutoutParams

/** A parameter key — used by `setParam` for a type-safe partial update. */
export type ParamKey = keyof Params

/** The loaded source sheet. `bitmap` is null until an image is dropped. */
export interface SourceState {
  readonly bitmap: ImageBitmap | null
  /** Base filename without extension, e.g. `asset-sheet`. Used for slice names. */
  readonly name: string
  readonly width: number
  readonly height: number
  /** Stable id sent to the worker with every `loadImage` / `analyze`. */
  readonly imageId: string
}

/** Lifecycle status of the current analysis run. */
export type AnalysisStatus = 'idle' | 'running' | 'done' | 'error'

/** One exported slice as tracked in the store (UI-facing, owns an object URL). */
export interface Slice {
  readonly id: string
  readonly index: number
  /** Editable, sanitized filename ending in `.png`. */
  readonly name: string
  readonly box: Box
  readonly blob: Blob
  /** `URL.createObjectURL(blob)` — revoked on replacement / clear. */
  readonly objectUrl: string
  readonly width: number
  readonly height: number
  readonly selected: boolean
}

/**
 * The analysis result plus its bookkeeping.
 *
 * `runId` monotonically increases; a worker reply whose `runId` is not the
 * current one is stale and dropped (its bitmaps closed) — see `useAnalysisBridge`
 * and `applyAnalysisResult`.
 */
export interface AnalysisState {
  readonly status: AnalysisStatus
  readonly runId: number
  readonly error: string | null
  /** Center-pane preview bitmap; replaced (old one closed) on each preview. */
  readonly previewBitmap: ImageBitmap | null
  readonly slices: readonly Slice[]
}

/** A slice result payload as delivered by the worker bridge. */
export interface AnalysisResult {
  readonly slices: readonly SliceInput[]
}

/** Raw per-slice data from the worker, before it becomes a store {@link Slice}. */
export interface SliceInput {
  readonly id: string
  readonly index: number
  readonly box: Box
  readonly blob: Blob
  readonly width: number
  readonly height: number
}

/** Read-only state fields. */
export interface StoreState {
  readonly source: SourceState
  readonly params: Params
  readonly analysis: AnalysisState
}

/** Actions (spec §5). All state updates are immutable. */
export interface StoreActions {
  /** Load a decoded bitmap as the new source, resetting analysis + selection. */
  loadImage(input: { bitmap: ImageBitmap; name: string }): void
  /** Update one param immutably (label update is instant; re-run is debounced). */
  setParam(key: ParamKey, value: number): void
  /** Reset all params to their defaults. */
  resetParams(): void
  /** Bump `runId`, mark `running`, and return the new id for the worker request. */
  beginAnalysis(): number
  /** Replace the preview bitmap for `runId`; drops (and closes) if stale. */
  applyPreview(runId: number, previewBitmap: ImageBitmap): void
  /** Commit slice results for `runId`; drops (and closes objectUrls) if stale. */
  applyAnalysisResult(runId: number, result: AnalysisResult): void
  /** Mark the current run as failed with a message (drops if stale). */
  failAnalysis(runId: number, message: string): void
  /** Select exactly one slice by id (clears others). */
  selectSlice(id: string): void
  /** Rename a slice (validated + sanitized + `.png`-suffixed). */
  renameSlice(id: string, name: string): void
  /** Clear the current selection. */
  clearSelection(): void
}

/** The full store: state + actions. */
export type Store = StoreState & StoreActions
