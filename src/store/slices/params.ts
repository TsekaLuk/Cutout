/**
 * Params slice (spec §4c / §5).
 *
 * Owns the four cutout parameters at their user-facing defaults. `setParam`
 * updates one key immutably; `resetParams` restores defaults. Re-running the
 * pipeline is NOT this slice's job — `useParamAutoRun` debounces and calls
 * `beginAnalysis`.
 */
import type { StateCreator } from 'zustand'
import type { Params, ParamKey, Store } from '@/store/types'

/** Default params (matches spec §4c table; `threshold` default 246). */
export const DEFAULT_PARAMS: Params = {
  threshold: 246,
  minArea: 900,
  mergeGap: 18,
  padding: 10,
}

export interface ParamsSlice {
  params: Params
  setParam(key: ParamKey, value: number): void
  resetParams(): void
}

export const createParamsSlice: StateCreator<Store, [], [], ParamsSlice> = (
  set,
) => ({
  params: DEFAULT_PARAMS,
  setParam: (key, value) =>
    set((state) => ({ params: { ...state.params, [key]: value } })),
  resetParams: () => set({ params: DEFAULT_PARAMS }),
})
