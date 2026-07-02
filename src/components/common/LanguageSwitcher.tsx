/**
 * LanguageSwitcher (spec §4.3).
 *
 * Switches the active locale via `activateLocale` → `i18n.loadAndActivate`, which
 * pushes an update through `<I18nProvider>`: every `Trans`/`useLingui` subscriber
 * re-renders in React 19 with NO page reload (panel/scroll state preserved). The
 * choice is persisted to the managed store (`persist = true`) so it survives a
 * restart.
 *
 * Two shapes:
 *   - `variant="icon"` — a standalone dropdown for the TopBar (globe trigger).
 *   - `variant="menu"` — a submenu fragment to nest inside an existing dropdown
 *                        (the SettingsMenu content).
 *
 * The locale display names are endonyms (each language named in its own script),
 * so they are intentionally NOT translated — the same in every UI language.
 */
import { Languages } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { activateLocale } from '@/i18n'
import { SUPPORTED, type Locale } from '@/i18n/config'

/** Native display name (endonym) for each shipped locale. Not translated. */
const LABEL: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
}

/** Persist + activate the chosen locale (live re-render, survives restart). */
const choose = (value: string): void => {
  void activateLocale(value as Locale, true)
}

export interface LanguageSwitcherProps {
  readonly variant?: 'icon' | 'menu'
}

export function LanguageSwitcher({ variant = 'icon' }: LanguageSwitcherProps) {
  const { t, i18n } = useLingui()
  const current = i18n.locale as Locale
  const label = t({ id: 'topbar.language_label', message: 'Language' })

  if (variant === 'menu') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Languages />
          {label}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={current} onValueChange={choose}>
            {SUPPORTED.map((locale) => (
              <DropdownMenuRadioItem key={locale} value={locale}>
                {LABEL[locale]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={label}>
              <Languages />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup value={current} onValueChange={choose}>
          {SUPPORTED.map((locale) => (
            <DropdownMenuRadioItem key={locale} value={locale}>
              {LABEL[locale]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
