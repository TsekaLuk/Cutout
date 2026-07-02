/**
 * ThemeToggle (spec §4c) — light/dark switch via next-themes.
 *
 * The provider (in AppShell) drives the `.dark` class our tokens key off. We
 * toggle between explicit light/dark (not `system`) so the click is predictable;
 * the icon reflects the *resolved* theme so it's correct even under `system`.
 */
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ThemeToggle() {
  const { t } = useLingui()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={
            isDark
              ? t({ id: 'topbar.theme_to_light', message: 'Switch to light mode' })
              : t({ id: 'topbar.theme_to_dark', message: 'Switch to dark mode' })
          }
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isDark ? (
          <Trans id="topbar.theme_light_mode">Light mode</Trans>
        ) : (
          <Trans id="topbar.theme_dark_mode">Dark mode</Trans>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
