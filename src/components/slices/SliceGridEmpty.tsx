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
import { Trans } from '@lingui/react/macro'
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
            <p className="text-sm font-medium">
              <Trans id="slices.empty_no_regions_title">No regions found</Trans>
            </p>
            <p className="max-w-64 text-xs text-muted-foreground">
              <Trans id="slices.empty_no_regions_hint">
                The parameters may be too strict for this sheet. Try loosening
                them:
              </Trans>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={lowerThreshold}>
              <Trans id="slices.empty_lower_threshold">−10 threshold</Trans>
            </Button>
            <Button variant="outline" size="sm" onClick={halveMinArea}>
              <Trans id="slices.empty_halve_min_area">−50% min-area</Trans>
            </Button>
          </div>
        </>
      ) : (
        <p className="max-w-56 text-xs text-muted-foreground">
          <Trans id="slices.empty_no_source">
            Drop an asset sheet into the left pane to start slicing.
          </Trans>
        </p>
      )}
    </div>
  )
}
