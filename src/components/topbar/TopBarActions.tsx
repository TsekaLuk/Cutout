/**
 * TopBarActions (spec §4c) — Import · Rerun · Export all, each with a tooltip
 * carrying its shortcut (the app's discoverability story, since there's no cmdk).
 *
 * Import and Export are self-contained (shared hooks); Rerun is injected from
 * AppShell because it needs the analysis bridge trigger. Buttons disable when
 * they'd be no-ops (no source / no slices / export in flight).
 */
import { FolderOpen, RefreshCw, DownloadCloud } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useImageImport } from '@/hooks/useImageImport'
import { useExport } from '@/hooks/useExport'
import { useSource, useSlices } from '@/store/selectors'
import { cn } from '@/lib/utils'

export interface TopBarActionsProps {
  readonly onRerun: () => void
}

export function TopBarActions({ onRerun }: TopBarActionsProps) {
  const { t } = useLingui()
  const { openPicker, inputProps } = useImageImport()
  const { exportAll, exportAllPending } = useExport()
  const hasSource = useSource().bitmap !== null
  const sliceCount = useSlices().length

  return (
    <div className="flex items-center gap-1.5">
      <ActionButton
        label={t({ id: 'topbar.import', message: 'Import' })}
        shortcut="⌘O"
        variant="outline"
        onClick={openPicker}
      >
        <FolderOpen />
        <Trans id="topbar.import">Import</Trans>
      </ActionButton>

      <ActionButton
        label={t({ id: 'topbar.rerun_label', message: 'Rerun analysis' })}
        shortcut="⌘R"
        variant="ghost"
        disabled={!hasSource}
        onClick={onRerun}
      >
        <RefreshCw />
        <Trans id="topbar.rerun_button">Rerun</Trans>
      </ActionButton>

      <ActionButton
        label={t({ id: 'topbar.export_all_label', message: 'Export all slices' })}
        shortcut="⌘⇧E"
        variant="default"
        disabled={sliceCount === 0 || exportAllPending}
        onClick={exportAll}
      >
        <DownloadCloud />
        <Trans id="topbar.export_all_button">Export all</Trans>
      </ActionButton>

      <input {...inputProps} type="file" accept="image/*" className="hidden" />
    </div>
  )
}

interface ActionButtonProps {
  readonly label: string
  readonly shortcut: string
  readonly variant: 'default' | 'outline' | 'ghost'
  readonly disabled?: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}

function ActionButton({
  label,
  shortcut,
  variant,
  disabled,
  onClick,
  children,
}: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant={variant}
          disabled={disabled}
          aria-label={`${label} (${shortcut})`}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{label}</span>
        <kbd
          className={cn(
            'rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground',
          )}
        >
          {shortcut}
        </kbd>
      </TooltipContent>
    </Tooltip>
  )
}
