/**
 * ParameterSlider (spec §4c).
 *
 * One labelled slider bound to a single param. `onValueChange` updates the store
 * (and thus the live label) at 0ms; the store change is what `useParamAutoRun`
 * debounces into a re-analyze — so `onValueCommit` is not separately needed for
 * correctness, but we still surface commit as the "settled" signal for future
 * preview-only tuning. The value label is monospaced + tabular for calm density.
 */
import { useStore } from '@/store'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ParamRange } from '@/lib/constants'

export interface ParameterSliderProps {
  readonly range: ParamRange
}

export function ParameterSlider({ range }: ParameterSliderProps) {
  const value = useStore((s) => s.params[range.key])
  const setParam = useStore((s) => s.setParam)

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Label
              htmlFor={`param-${range.key}`}
              className="cursor-help text-xs font-medium text-foreground/80"
            >
              {range.label}
            </Label>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-56 text-xs">
            {range.hint}
          </TooltipContent>
        </Tooltip>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {value}
        </span>
      </div>
      <Slider
        id={`param-${range.key}`}
        aria-label={range.label}
        min={range.min}
        max={range.max}
        step={range.step}
        value={[value]}
        onValueChange={(next) => setParam(range.key, next[0])}
      />
    </div>
  )
}
