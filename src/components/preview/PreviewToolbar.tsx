/**
 * PreviewToolbar (spec §4c) — zoom (fit / 1:1) + checkerboard toggle.
 *
 * Pure view controls; state is owned by PreviewPanel and threaded down. Disabled
 * when there is no preview to look at.
 */
import { Maximize2, Scan, Grid2x2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ZoomMode } from './PreviewCanvas'

export interface PreviewToolbarProps {
  readonly zoom: ZoomMode
  readonly checker: boolean
  readonly enabled: boolean
  readonly onZoomChange: (zoom: ZoomMode) => void
  readonly onCheckerToggle: () => void
}

export function PreviewToolbar({
  zoom,
  checker,
  enabled,
  onZoomChange,
  onCheckerToggle,
}: PreviewToolbarProps) {
  return (
    <div className="flex items-center gap-1">
      <ToolbarToggle
        label="Fit to pane"
        active={zoom === 'fit'}
        disabled={!enabled}
        onClick={() => onZoomChange('fit')}
      >
        <Maximize2 />
      </ToolbarToggle>
      <ToolbarToggle
        label="Actual size (1:1)"
        active={zoom === 'actual'}
        disabled={!enabled}
        onClick={() => onZoomChange('actual')}
      >
        <Scan />
      </ToolbarToggle>
      <Separator orientation="vertical" className="mx-1 h-4" />
      <ToolbarToggle
        label="Toggle checkerboard"
        active={checker}
        disabled={!enabled}
        onClick={onCheckerToggle}
      >
        <Grid2x2 />
      </ToolbarToggle>
    </div>
  )
}

interface ToolbarToggleProps {
  readonly label: string
  readonly active: boolean
  readonly disabled: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}

function ToolbarToggle({
  label,
  active,
  disabled,
  onClick,
  children,
}: ToolbarToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          className={cn(active && 'bg-muted text-foreground')}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}
