/**
 * ParameterControls (spec §4c) — the four sliders under the source image.
 *
 * Params live here (not in the right rail) because they describe how the source
 * is *read*. Disabled until an image is loaded so users can't tweak into a void.
 */
import { Trans, useLingui } from '@lingui/react/macro'
import { useSource } from '@/store/selectors'
import { useStore } from '@/store'
import { PARAM_RANGES } from '@/lib/constants'
import { ParameterSlider } from './ParameterSlider'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

export function ParameterControls() {
  const { t } = useLingui()
  const hasSource = useSource().bitmap !== null
  const resetParams = useStore((s) => s.resetParams)

  return (
    <section
      aria-label={t({ id: 'source.params_aria', message: 'Cutout parameters' })}
      className="grid gap-3"
      data-disabled={!hasSource || undefined}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Trans id="source.params_heading">Parameters</Trans>
        </h2>
        <Button
          variant="ghost"
          size="xs"
          onClick={resetParams}
          disabled={!hasSource}
          title={t({
            id: 'source.params_reset_title',
            message: 'Reset parameters to defaults',
          })}
        >
          <RotateCcw />
          <Trans id="source.params_reset">Reset</Trans>
        </Button>
      </div>
      <div
        className="grid gap-3.5 data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
        data-disabled={!hasSource || undefined}
      >
        {PARAM_RANGES.map((range) => (
          <ParameterSlider key={range.key} range={range} />
        ))}
      </div>
    </section>
  )
}
