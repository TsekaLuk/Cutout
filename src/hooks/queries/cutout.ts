/**
 * Export mutations (spec §5 / §6).
 *
 * Export is async and can fail (disk error, user cancel), so it lives in a
 * TanStack Query mutation — `isPending`/`isError` replace the old manual
 * "导出中…" DOM juggling. The payload is snapshotted from the store at
 * mutate-time (not render-time), so an in-flight slider drag can't corrupt it.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoreState } from '@/store'
import { selectExportPayload, selectExportPayloadFor } from '@/store/selectors'
import { useServices } from '@/services/context'
import type { AssetToSave, Result, SaveManyOutcome } from '@/services/types'
import { isErr } from '@/services/types'
import { assetKeys } from './keys'

/** Options accepted by both export mutations. */
export interface ExportOptions {
  readonly destDir?: string
}

/** Unwrap a service `Result`, throwing so the mutation enters its error state. */
function unwrap(result: Result<SaveManyOutcome>): SaveManyOutcome {
  if (isErr(result)) throw new Error(result.error)
  return result.data
}

/** Export every current slice. */
export function useExportAll() {
  const { assets } = useServices()
  const queryClient = useQueryClient()

  return useMutation<SaveManyOutcome, Error, ExportOptions | undefined>({
    mutationFn: async (opts) => {
      const payload: AssetToSave[] = selectExportPayload(getStoreState())
      return unwrap(await assets.saveMany(payload, opts))
    },
    onSuccess: (outcome) => {
      if (!outcome.canceled) {
        void queryClient.invalidateQueries({ queryKey: assetKeys.all })
      }
    },
  })
}

/** Export a single slice by id. */
export function useExportOne() {
  const { assets } = useServices()
  const queryClient = useQueryClient()

  return useMutation<
    SaveManyOutcome,
    Error,
    { id: string; opts?: ExportOptions }
  >({
    mutationFn: async ({ id, opts }) => {
      const payload: AssetToSave[] = selectExportPayloadFor(getStoreState(), id)
      return unwrap(await assets.saveMany(payload, opts))
    },
    onSuccess: (outcome) => {
      if (!outcome.canceled) {
        void queryClient.invalidateQueries({ queryKey: assetKeys.all })
      }
    },
  })
}
