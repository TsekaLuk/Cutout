/**
 * Export orchestration with toast feedback (spec §6 step 6).
 *
 * Thin wrapper over the `useExportAll` / `useExportOne` mutations that turns a
 * `SaveManyOutcome` into user-facing Sonner toasts (partial success, cancel,
 * error) so every export entry point behaves identically. Components read
 * `isPending` off the returned mutations for their button states.
 */
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useExportAll, useExportOne } from '@/hooks/queries/cutout'
import type { SaveManyOutcome } from '@/services/types'

/** Toast the result of a save (shared by all export buttons). */
function reportOutcome(outcome: SaveManyOutcome): void {
  if (outcome.canceled) return
  const savedCount = outcome.saved.length
  const failedCount = outcome.failed.length

  if (savedCount === 0 && failedCount > 0) {
    toast.error(`Export failed: ${outcome.failed[0]?.error ?? 'unknown error'}`)
    return
  }
  const where = outcome.outputDir ? ` → ${outcome.outputDir}` : ''
  if (failedCount > 0) {
    toast.warning(
      `Exported ${savedCount} of ${savedCount + failedCount}${where}`,
    )
  } else {
    toast.success(
      `Exported ${savedCount} ${savedCount === 1 ? 'slice' : 'slices'}${where}`,
    )
  }
}

export interface ExportControls {
  readonly exportAllPending: boolean
  readonly exportOnePending: boolean
  exportAll(): void
  exportOne(id: string): void
}

export function useExport(): ExportControls {
  const exportAllMutation = useExportAll()
  const exportOneMutation = useExportOne()

  const exportAll = useCallback((): void => {
    exportAllMutation.mutate(undefined, {
      onSuccess: reportOutcome,
      onError: (error) => toast.error(error.message),
    })
  }, [exportAllMutation])

  const exportOne = useCallback(
    (id: string): void => {
      exportOneMutation.mutate(
        { id },
        {
          onSuccess: reportOutcome,
          onError: (error) => toast.error(error.message),
        },
      )
    },
    [exportOneMutation],
  )

  return {
    exportAllPending: exportAllMutation.isPending,
    exportOnePending: exportOneMutation.isPending,
    exportAll,
    exportOne,
  }
}
