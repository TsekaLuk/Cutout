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
import { useLingui } from '@lingui/react/macro'
import { plural } from '@lingui/core/macro'
import { useExportAll, useExportOne } from '@/hooks/queries/cutout'
import type { SaveManyOutcome } from '@/services/types'

export interface ExportControls {
  readonly exportAllPending: boolean
  readonly exportOnePending: boolean
  exportAll(): void
  exportOne(id: string): void
}

export function useExport(): ExportControls {
  const { t } = useLingui()
  const exportAllMutation = useExportAll()
  const exportOneMutation = useExportOne()

  /** Toast the result of a save (shared by all export buttons). */
  const reportOutcome = useCallback(
    (outcome: SaveManyOutcome): void => {
      if (outcome.canceled) return
      const savedCount = outcome.saved.length
      const failedCount = outcome.failed.length
      const where = outcome.outputDir ? ` → ${outcome.outputDir}` : ''

      if (savedCount === 0 && failedCount > 0) {
        const reason =
          outcome.failed[0]?.error ??
          t({ id: 'export.error_unknown', message: 'unknown error' })
        toast.error(
          t({ id: 'export.toast_failed', message: `Export failed: ${reason}` }),
        )
        return
      }
      if (failedCount > 0) {
        const total = savedCount + failedCount
        const summary = t({
          id: 'export.toast_partial',
          message: `Exported ${savedCount} of ${total}`,
        })
        toast.warning(`${summary}${where}`)
      } else {
        const summary = t({
          id: 'export.toast_success',
          message: plural(savedCount, {
            one: 'Exported # slice',
            other: 'Exported # slices',
          }),
        })
        toast.success(`${summary}${where}`)
      }
    },
    [t],
  )

  const exportAll = useCallback((): void => {
    exportAllMutation.mutate(undefined, {
      onSuccess: reportOutcome,
      onError: (error) => toast.error(error.message),
    })
  }, [exportAllMutation, reportOutcome])

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
    [exportOneMutation, reportOutcome],
  )

  return {
    exportAllPending: exportAllMutation.isPending,
    exportOnePending: exportOneMutation.isPending,
    exportAll,
    exportOne,
  }
}
