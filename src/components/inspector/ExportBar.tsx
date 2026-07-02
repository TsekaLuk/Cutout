/**
 * ExportBar (spec §4c) — per-slice export plus an export-all mirror.
 *
 * Both buttons drive the same Query mutations (via `useExport`), so their
 * `isPending` states and toasts match the TopBar. The single-slice button is
 * primary here because the inspector is slice-focused; export-all is the calmer
 * secondary mirror.
 */
import { Download, DownloadCloud } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@/components/ui/button'
import { useExport } from '@/hooks/useExport'
import { useSlices } from '@/store/selectors'
import type { Slice } from '@/store/types'

export interface ExportBarProps {
  readonly slice: Slice
}

export function ExportBar({ slice }: ExportBarProps) {
  const { t } = useLingui()
  const { exportOne, exportAll, exportOnePending, exportAllPending } =
    useExport()
  const total = useSlices().length

  return (
    <div className="flex items-center gap-2">
      <Button
        className="flex-1"
        size="sm"
        disabled={exportOnePending}
        onClick={() => exportOne(slice.id)}
      >
        <Download />
        <Trans id="inspector.export_slice">Export slice</Trans>
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={exportAllPending || total === 0}
        onClick={exportAll}
        title={t({
          id: 'inspector.export_all_tooltip',
          message: 'Export all slices',
        })}
      >
        <DownloadCloud />
        <Trans id="inspector.export_all_button">All ({total})</Trans>
      </Button>
    </div>
  )
}
