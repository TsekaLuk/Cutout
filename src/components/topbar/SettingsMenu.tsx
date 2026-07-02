/**
 * SettingsMenu (spec §4c) — a small dropdown: reset params, about.
 *
 * Deliberately tiny in v1 (no cmdk, few actions). Reset mirrors the inline
 * button in ParameterControls; "About" toasts the build identity for now.
 */
import { useState } from 'react'
import { Settings2, RotateCcw, Info, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Trans, useLingui } from '@lingui/react/macro'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ProviderSettingsDialog } from '@/components/settings/ProviderSettingsDialog'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

export function SettingsMenu() {
  const { t } = useLingui()
  const resetParams = useStore((s) => s.resetParams)
  const [providersOpen, setProvidersOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t({ id: 'settings.menu_label', message: 'Settings' })}
          >
            <Settings2 />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>
            <Trans id="settings.menu_label">Settings</Trans>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => resetParams()}>
            <RotateCcw />
            <Trans id="settings.reset_params">Reset parameters</Trans>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setProvidersOpen(true)}>
            <KeyRound />
            <Trans id="settings.api_keys">API Keys / Providers</Trans>
          </DropdownMenuItem>
          <LanguageSwitcher variant="menu" />
          <DropdownMenuItem
            onSelect={() =>
              toast('Cutout', {
                description: t({
                  id: 'settings.about_description',
                  message:
                    'AI-Native UI/UX · Tauri 2 · React 19 — local, offline-first.',
                }),
              })
            }
          >
            <Info />
            <Trans id="settings.about_item">About</Trans>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProviderSettingsDialog
        open={providersOpen}
        onOpenChange={setProvidersOpen}
      />
    </>
  )
}
