/**
 * SliceGridEmpty (spec §4c) — zero-region guidance + one-click quick-fixes.
 *
 * Two failure shapes share this view:
 *  - no source yet → prompt to import (handled by the left pane; here we just
 *    show a calm hint).
 *  - a source analyzed to zero regions → the params are likely too strict, so
 *    we offer nudges ("−10 threshold", "−50% min-area") that mutate a param and
 *    let `useParamAutoRun` rerun automatically.
 */
import { PackageOpen } from 'lucide-react'
import { useStore } from '@/store'
import { useSource } from '@/store/selectors'
import { Button } from '@/components/ui/button'
import { PARAM_RANGE_BY_KEY } from '@/lib/constants'

export function SliceGridEmpty() {
  const hasSource = useSource().bitmap !== null
  const setParam = useStore((s) => s.setParam)
  const params = useStore((s) => s.params)

  const lowerThreshold = (): void => {
    const { min } = PARAM_RANGE_BY_KEY.threshold
    setParam('threshold', Math.max(min, params.threshold - 10))
  }
  const halveMinArea = (): void => {
    const { min } = PARAM_RANGE_BY_KEY.minArea
    setParam('minArea', Math.max(min, Math.round(params.minArea / 2)))
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <PackageOpen className="size-8 text-muted-foreground/60" />
      {hasSource ? (
        <>
          <div className="grid gap-1">
            <p className="text-sm font-medium">No regions found</p>
            <p className="max-w-64 text-xs text-muted-foreground">
              The parameters may be too strict for this sheet. Try loosening
              them:
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={lowerThreshold}>
              −10 threshold
            </Button>
            <Button variant="outline" size="sm" onClick={halveMinArea}>
              −50% min-area
            </Button>
          </div>
        </>
      ) : (
        <p className="max-w-56 text-xs text-muted-foreground">
          Drop an asset sheet into the left pane to start slicing.
        </p>
      )}
    </div>
  )
}
