/**
 * Debounced auto-run over an injected analyze trigger.
 *
 * This is the Phase-4 shell's counterpart to `useParamAutoRun`: same ~120ms
 * settle-then-analyze behaviour, but it takes the `analyze` function from a
 * bridge the SHELL already owns. That lets AppShell hold a SINGLE
 * `useAnalysisBridge` (one Worker) and drive both the param-change auto-run AND
 * the manual "Rerun" button from it — avoiding a second worker that calling
 * `useParamAutoRun` (which mounts its own bridge) would create.
 *
 * Behaviour matches spec §5/§6: collapse a slider drag-storm into one run and
 * let a newer runId supersede an older one in the worker.
 */
import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { selectParams, selectSource } from '@/store/selectors'
import { AUTO_RUN_DEBOUNCE_MS } from './useParamAutoRun'

export function useAutoRun(analyze: (wantSlices: boolean) => void): void {
  const params = useStore(selectParams)
  const source = useStore(selectSource)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasSource = source.bitmap !== null && source.imageId !== ''

  useEffect(() => {
    if (!hasSource) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      analyze(true)
      timerRef.current = null
    }, AUTO_RUN_DEBOUNCE_MS)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [
    analyze,
    hasSource,
    source.imageId,
    params.threshold,
    params.minArea,
    params.mergeGap,
    params.padding,
  ])
}
