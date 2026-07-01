/**
 * The single Zustand store (spec §5), composed from four slices:
 *   source · params · analysis · selection
 *
 * A single store keeps cross-slice actions (e.g. `loadImage` resetting analysis)
 * trivially consistent while selectors keep components subscribed to the minimum
 * they need. `useShallow` (see `selectors.ts`) guards array selectors.
 */
import { create } from 'zustand'
import type { Store } from './types'
import { createSourceSlice } from './slices/source'
import { createParamsSlice } from './slices/params'
import { createAnalysisSlice } from './slices/analysis'
import { createSelectionSlice } from './slices/selection'

export const useStore = create<Store>()((...a) => ({
  ...createSourceSlice(...a),
  ...createParamsSlice(...a),
  ...createAnalysisSlice(...a),
  ...createSelectionSlice(...a),
}))

/** Non-reactive snapshot accessor (for mutation payloads / worker glue). */
export const getStoreState = useStore.getState

export type { Store } from './types'
