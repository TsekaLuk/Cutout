/**
 * Analysis slice (spec §5 / §6).
 *
 * Owns the analysis lifecycle: monotonic `runId`, status, error, the center
 * preview bitmap, and the committed slices. The core correctness rules:
 *
 *  - `beginAnalysis` bumps `runId` and marks `running`, returning the new id so
 *    the caller can tag the worker request.
 *  - Every apply/fail is guarded by `runId`: a reply for a superseded run is
 *    dropped and its GPU/URL resources released (`bitmap.close()`,
 *    `URL.revokeObjectURL`) — a real leak guard, not optional.
 */
import type { StateCreator } from 'zustand'
import { defaultSliceName } from '@/lib/filename'
import type {
  AnalysisResult,
  AnalysisState,
  Slice,
  Store,
} from '@/store/types'

/** The pristine analysis state (no run has happened yet). */
export const INITIAL_ANALYSIS: AnalysisState = {
  status: 'idle',
  runId: 0,
  error: null,
  previewBitmap: null,
  slices: [],
}

/** Close the preview bitmap and revoke every slice objectUrl in a state. */
export function disposeAnalysis(analysis: AnalysisState): void {
  analysis.previewBitmap?.close()
  for (const slice of analysis.slices) URL.revokeObjectURL(slice.objectUrl)
}

export interface AnalysisSlice {
  analysis: AnalysisState
  beginAnalysis(): number
  applyPreview(runId: number, previewBitmap: ImageBitmap): void
  applyAnalysisResult(runId: number, result: AnalysisResult): void
  failAnalysis(runId: number, message: string): void
}

export const createAnalysisSlice: StateCreator<Store, [], [], AnalysisSlice> = (
  set,
  get,
) => ({
  analysis: INITIAL_ANALYSIS,

  beginAnalysis: () => {
    const runId = get().analysis.runId + 1
    set((state) => ({
      analysis: {
        ...state.analysis,
        runId,
        status: 'running',
        error: null,
      },
    }))
    return runId
  },

  applyPreview: (runId, previewBitmap) => {
    const { analysis } = get()
    // Stale reply: a newer run superseded this one. Drop + release GPU memory.
    if (runId !== analysis.runId) {
      previewBitmap.close()
      return
    }
    analysis.previewBitmap?.close()
    set((state) => ({ analysis: { ...state.analysis, previewBitmap } }))
  },

  applyAnalysisResult: (runId, result) => {
    const { analysis, source } = get()
    // Stale: the incoming blobs never had objectUrls created, so just drop.
    if (runId !== analysis.runId) return

    // Replace any slices already committed for this run; revoke their URLs.
    for (const prev of analysis.slices) URL.revokeObjectURL(prev.objectUrl)

    const base = source.name || 'asset'
    const slices: Slice[] = result.slices.map((s) => ({
      id: s.id,
      index: s.index,
      name: defaultSliceName(base, s.index),
      box: s.box,
      blob: s.blob,
      objectUrl: URL.createObjectURL(s.blob),
      width: s.width,
      height: s.height,
      selected: false,
    }))

    set((state) => ({ analysis: { ...state.analysis, status: 'done', slices } }))
  },

  failAnalysis: (runId, message) => {
    if (runId !== get().analysis.runId) return
    set((state) => ({
      analysis: { ...state.analysis, status: 'error', error: message },
    }))
  },
})
