/**
 * AppShell (spec §4c) — root layout + global wiring.
 *
 * Owns the SINGLE live-preview analysis bridge (one Worker) and drives:
 *   - the debounced param auto-run (`useAutoRun`),
 *   - the manual ⌘R / Rerun trigger,
 *   - the global keyboard map (`useHotkeys`) → import / export / nav / rename.
 *
 * Layout is a column: TopBar · WorkspaceLayout (grows) · StatusBar. The service
 * registry + query/tooltip/toast providers are mounted above this in App.
 */
import { useCallback, useMemo } from 'react'
import { TopBar } from './topbar/TopBar'
import { WorkspaceLayout } from './workspace/WorkspaceLayout'
import { StatusBar } from './status/StatusBar'
import { useAnalysisBridge } from '@/hooks/useAnalysisBridge'
import { useAutoRun } from '@/hooks/useAutoRun'
import { useHotkeys, type HotkeyHandlers } from '@/hooks/useHotkeys'
import { useImageImport } from '@/hooks/useImageImport'
import { useExport } from '@/hooks/useExport'
import { useSliceNavigation } from '@/hooks/useSliceNavigation'
import { requestRename } from '@/hooks/useRenameIntent'
import { useStore, getStoreState } from '@/store'

export function AppShell() {
  // One bridge / one worker for the whole shell (auto-run + manual rerun).
  const { analyze } = useAnalysisBridge()
  useAutoRun(analyze)

  const { openPicker } = useImageImport()
  const { exportAll, exportOne } = useExport()
  const nav = useSliceNavigation()
  const clearSelection = useStore((s) => s.clearSelection)

  const rerun = useCallback(() => {
    // Re-analyze current params (with slices) using the shell's own bridge.
    if (getStoreState().source.bitmap) analyze(true)
  }, [analyze])

  const exportSelected = useCallback(() => {
    const selected = getStoreState().analysis.slices.find((s) => s.selected)
    if (selected) exportOne(selected.id)
    else exportAll()
  }, [exportOne, exportAll])

  const renameSelected = useCallback(() => {
    const selected = getStoreState().analysis.slices.find((s) => s.selected)
    if (selected) requestRename(selected.id)
  }, [])

  const handlers = useMemo<HotkeyHandlers>(
    () => ({
      onImport: openPicker,
      onRerun: rerun,
      onExportAll: exportAll,
      onExportSelected: exportSelected,
      onPrev: nav.prev,
      onNext: nav.next,
      onMove: nav.move,
      onRename: renameSelected,
      onClear: clearSelection,
    }),
    [
      openPicker,
      rerun,
      exportAll,
      exportSelected,
      nav.prev,
      nav.next,
      nav.move,
      renameSelected,
      clearSelection,
    ],
  )
  useHotkeys(handlers)

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <TopBar onRerun={rerun} />
      <WorkspaceLayout />
      <StatusBar />
    </div>
  )
}
